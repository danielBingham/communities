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
const bcrypt = require('bcrypt');

const ServiceError = require('../errors/ServiceError')

const UserDAO = require('../daos/UserDAO')
const FileDAO = require('../daos/FileDAO')

module.exports = class AuthenticationService {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger

        this.userDAO = new UserDAO(core)
        this.fileDAO = new FileDAO(core)
    }

    /**
     * Returns the hash password.
     *
     * THIS IS A SYNCHRONOUS METHOD. 
     */
    hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }

    /**
     * Checks a password against the hash.
     *
     * THIS IS A SYNCHRONUS MEHTOD.
     */
    checkPassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }

    /**
     *
     */
    async getSessionForUserId(id ) {
        const results = await this.userDAO.selectUsers('WHERE users.id=$1', [id])
        if ( results.list.length <= 0) {
            throw new ServiceError('no-user', 'Failed to get full record for authenticated user!')
        } 

        const user = results.dictionary[id]

        let file = null
        if ( user.fileId !== null ) {
            const fileResults = await this.fileDAO.selectFiles(`WHERE files.id = $1`, [ user.fileId ])
            file = fileResults[0]
        }
        

        return {
            user: user,
            file: file
        }
    }

    async authenticateUser(credentials) {
        /*************************************************************
         * To authenticate the user we need to check the following things:
         *
         * 1. Their email is attached to a user record in the database.
         * 2. Their email is only attached to one user record in the database.
         * 3. They have a password set. (If they don't, they authenticated with
         * ORCID iD and cannot authenticate with this endpoint.)
         * 4. The submitted credentials include a password.
         * 5. The passwords match.
         * 
         * **********************************************************/
        const results = await this.database.query(
            'select id, password from users where email = $1',
            [ credentials.email ]
        )

        // 1. Their email is attached to a user record in the database.
        if ( results.rows.length <= 0) {
            throw new ServiceError('no-user', `No users exist with email ${credentials.email}.`)
        }

        // 2. Their email is only attached to one user record in the database.
        if (results.rows.length > 1 ) {
            throw new ServiceError('multiple-users', `Multiple users found for email ${credentials.email}.`)
        }

        // 3. They have a password set. (If they don't, they authenticated with
        // ORCID iD and cannot authenticate with this endpoint.)
        if ( ! results.rows[0].password || results.rows[0].password.trim().length <= 0) {
            throw new ServiceError('no-user-password', `User(${credentials.email}) doesn't have a password set.`)
        }

        // 4. The submitted credentials include a password.
        if ( ! credentials.password || credentials.password.trim().length <= 0 ) {
            throw new ServiceError('no-credential-password', `User(${credentials.email}) attempted to login with no password.`)
        }

        // 5. The passwords match.
        const userMatch = results.rows[0]
        const passwords_match = this.checkPassword(credentials.password, userMatch.password)
        if (! passwords_match) {
            throw new ServiceError('authentication-failed', `Failed login for email ${credentials.email}.`)
        }
        
        return userMatch.id 
    }

    async connectOrcid(request, orcidId) {
        const user = {
            id: request.session.user.id,
            orcidId: orcidId
        }
        await this.userDAO.updatePartialUser(user)

        const responseBody = await this.loginUser(request.session.user.id, request)
        responseBody.type = "connection"
        return responseBody
    }
}
