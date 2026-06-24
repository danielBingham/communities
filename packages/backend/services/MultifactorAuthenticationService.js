/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
const crypto  = require('node:crypto')
const bcrypt = require('bcrypt')
const { generateSecret, verify } = require('otplib')

const UserDAO = require('../daos/UserDAO')

module.exports = class MultifactorAuthenticationService {

    constructor(core) {
        this.core = core

        this.userDAO = new UserDAO(core)
    }

    async disable(userId) {

        // Clear out the multifactor authentication state.
        const userPatch = {
            id: userId,
            authenticationMultifactorSecret: null,
            authenticationMultifactorBackups: {},
            authenticationMultifactorState: 'disabled'
        }

        await this.userDAO.updateUser(userPatch)
    }

    async initialize(userId) {
        const secret = generateSecret()

        // Update the secret first.  The secret doesn't go through the DAO.

        const userPatch = {
            id: userId,
            authenticationMultifactorSecret: secret,
            authenticationMultifactorState: 'pending'
        }

        await this.userDAO.updateUser(userPatch)

        return secret
    }

    async verify(userId, token) {
        const secretResults = await this.core.database.query(`
            SELECT authentication__multifactor_secret as secret FROM users WHERE users.id = $1
        `, [ userId ])

        if ( secretResults.rows.length <= 0 ) {
            return false
        }

        if ( secretResults.rows.length > 1 ) {
            return false
        }

        const secret = secretResults.rows[0].secret

        if ( secret === undefined || secret === null ) {
            return false
        }

        const result = await verify({ secret: secret, token: token })

        return result.valid
    }

    async enable(userId) {
        const backups = {}

        for(let i = 0; i < 10; i++) {

        }
        
        const userPatch = {
            id: userId,
            authenticationMultifactorState: 'enabled',
            authenticationMultifactorBackup: backups
        }

        await this.userDAO.updateUser(userPatch)

    }

    async generateBackupCodes(userId) {
        const params = []
        let sql = `INSERT INTO user_recovery_codes (user_id, code) VALUES `

        const codes = []
        const promises = []

        for(let count = 0; count < 10; count++) {
            const code = crypto.randomBytes(7).toString('hex')
            codes.push(code)

            promises.push(bcrypt.hash(code, 12).then(function(hash) {
                params.push(userId)
                params.push(hash)
                sql += `($${params.length-1}, $${params.length}),`
            }))
        }

        await Promise.all(promises)

        // Peel off the last comma.
        sql = sql.substring(0, sql.length-1)

        console.log(sql)
        console.log(params)
        await this.core.database.query(sql, params)

        return codes
    }
}
