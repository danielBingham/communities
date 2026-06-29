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

const EncryptionService = require('./EncryptionService')

/**
 * A service to handle all aspects of managing Multifactor Authentication using
 * a TOPT algorithm through `otplib`.
 */
module.exports = class MultifactorAuthenticationService {

    constructor(core) {
        this.core = core

        this.userDAO = new UserDAO(core)
        
        this.encryptionService = new EncryptionService(core)
    }

    /**
     * Disable multifactor authentication for User(userId) and delete their
     * secret and recovery codes.
     *
     * @param {uuid} userId The id of the User we wish to disable MFA for.
     *
     * @return {void}
     */
    async disable(userId) {
        // TODO This should really be a transaction!
        //
        // But in the mean time, it's okay because we do the critical thing
        // first: we turn off multifactor.  Once we've done that, the secret
        // and backup codes are pretty much void. They will both be overriden
        // when it's next enabled.
       
        // Set multifactor authentication to `disabled' first.  This is so that
        // they don't get left in a state where they can't authenticate because
        // multifactor authentication is enabled but the secret is gone.
        const userPatch = {
            id: userId,
            authenticationMultifactorState: 'disabled'
        }
        await this.userDAO.updateUser(userPatch)

        // Now clear the secret.
        // The secret is intentionally left out of the DAO so that we don't accidentially leak it.
        await this.core.database.query(`
            UPDATE users SET authentication__multifactor_secret = $1 WHERE id = $2
        `, [ null, userId ])

        // Now delete their recovery codes to cleanup.
        await this.clearRecoveryCodes(userId)

    }

    /**
     * Initialize multifactor authentication for User(userId).  Generate a new
     * secret, encrypt it, and store it in the database under a 'pending'
     * state.
     *
     * @param {userId} uuid The id of the User we wish to initialize MFA for.
     *
     * @return {string} The unencrypted MFA secret.
     */
    async initialize(userId) {
        const secret = generateSecret()

        const encryptedSecret = await this.encryptionService.encrypt(secret, userId, 'mfa', 'v1')

        // TODO This should really be a transaction.
        //
        // But we've done it in an order where it's okay that it's not.  If it
        // fails while setting the secret, then it fails. If it fails while
        // setting the user to 'pending', then we have an unused secret hanging
        // out in the database. It'll be overridden when they try to initialize
        // again.
        
        // Set the secret in the database first, so that it's present when we turn MFA to "pending".
        await this.core.database.query(`
            UPDATE users SET authentication__multifactor_secret = $1 WHERE id = $2
        `, [ encryptedSecret, userId])

        const userPatch = {
            id: userId,
            authenticationMultifactorState: 'pending'
        }

        await this.userDAO.updateUser(userPatch)

        return secret
    }

    /**
     * Use `otplib` to verify a TOPT token for User(userId). Retrieve their
     * multifactor authentication secret from the database, decrypt it, and
     * verify it against the provided token.  When verification fails due to an
     * error, log the error and simply return false.
     *
     * @param {uuid} userId The id of the User we want to verify.
     * @param {string} token The 6 digit TOPT token.
     *
     * @return {boolean} True if verification succeeded, false otherwise.
     */
    async verify(userId, token) {
        try { 
            const secretResults = await this.core.database.query(`
                SELECT authentication__multifactor_secret as secret FROM users WHERE users.id = $1
            `, [ userId ])

            if ( secretResults.rows.length <= 0 ) {
                return false
            }

            if ( secretResults.rows.length > 1 ) {
                this.core.logger.warn(`Multiple MFA secrets found for User(${userId}).`)
                return false
            }

            const encryptedSecret = secretResults.rows[0].secret

            if ( encryptedSecret === undefined || encryptedSecret === null ) {
                this.core.logger.warn('Encrypted MFA secret missing during verification.')
                return false
            }

            const secret = await this.encryptionService.decrypt(encryptedSecret, userId, 'mfa', 'v1')

            if ( secret === undefined || secret === null ) {
                this.core.logger.warn('Decrypted MFA secret missing during verification.')
                return false
            }

            const result = await verify({ secret: secret, token: token })

            return result.valid
        } catch (error) {
            this.core.logger.error(`Failed to verify multifactor token: `, error)
            return false
        }
    }

    /**
     * Enable multifactor authentication for User(userId).  Once flipped into
     * `enabled` the user will need to enter their TOPT token to successfully
     * log in.  This method assumes we've already asked them to verify their
     * setup by using `verify()` against a token they've provided.
     *
     * @param {uuid} userId The id of the User we wish to enable MFA for.
     * 
     * @return {void}
     */
    async enable(userId) {
        const userPatch = {
            id: userId,
            authenticationMultifactorState: 'enabled',
        }

        await this.userDAO.updateUser(userPatch)
    }

    async clearRecoveryCodes(userId) {
        await this.core.database.query(`
            DELETE FROM user_recovery_codes WHERE user_id = $1
        `, [ userId ])
    }

    /**
     * Generate ten recovery codes for User(userId).  Hash the codes and store
     * them in the database.  Return the unhashed codes so that they may be
     * provided to the user.
     *
     * @param {uuid} userId The id of the User to generate codes for.
     *
     * @return {string[]} An array with the unhashed recovery codes.
     */
    async generateRecoveryCodes(userId) {
        // Before we generate new recovery codes, wipe out any old ones that
        // might still be hanging around.  We only ever want <=10 codes in the
        // database.
        await this.clearRecoveryCodes(userId)

        // Okay, now generate the new codes.
        //

        const codes = []
        const hashes = []
        const promises = []

        for(let count = 0; count < 10; count++) {
            const code = crypto.randomBytes(7).toString('hex')
            codes.push(code)

            promises.push(bcrypt.hash(code, 12).then(function(hash) {
                hashes.push(hash)
            }))
        }

        await Promise.all(promises)

        // Now generate the SQL to insert the codes.
        const params = []
        let sql = `INSERT INTO user_recovery_codes (user_id, code) VALUES `

        for(const hash of hashes) {
            params.push(userId)
            params.push(hash)
            sql += `($${params.length-1}, $${params.length}),`
        }

        // Peel off the last comma.
        sql = sql.substring(0, sql.length-1)

        await this.core.database.query(sql, params)

        return codes
    }

    /**
     * Verify a recovery code provided by User(userId).  Confirm it is one of
     * their codes and that it has not already been used. Once verified, remove
     * it from the database. Codes may only be used once.
     *
     * Doesn't throw errors.  If we encouter an error, log it and return false.
     *
     * @param {uuid} userId The id of the User who's code we're verifying.
     * @param {string} code The recovery code to verify.
     *
     * @return {boolean} True if verified, false otherwise.
     */
    async verifyRecoveryCode(userId, code) {
        try {
            const results = await this.core.database.query(`
                SELECT code as code_hash FROM user_recovery_codes WHERE user_id = $1
            `, [ userId ])

            if ( results.rows.length <= 0 ) {
                return false
            }

            const promises = []
            let codeHashes = [] 

            for(const row of results.rows) {
                promises.push(bcrypt.compare(code, row.code_hash).then((isCode) => {
                    if ( isCode === true) {
                        codeHashes.push(row.code_hash)
                    }
                }))
            }

            await Promise.all(promises)

            if ( codeHashes.length <= 0 ) {
                return false
            }

            if ( codeHashes.length > 1 ) {
                this.core.logger.error(`Recovery code for User(${userId}) matched multiple hashes.  THIS SHOULD NEVER HAPPEN!`)
                return false
            }

            const codeHash = codeHashes[0]
            if ( codeHash !== null && codeHash !== undefined ) {
                // Do one more check, just to be extra sure we got the match.
                // Yeah, this is probably overkill, but better safe than breach.
                const finalCheck = await bcrypt.compare(code, codeHash)
                if ( finalCheck === true ) {

                    try {
                        // Remove the code after verifying it so that it cannot be used again.
                        const deleteResults = await this.core.database.query(
                            `DELETE FROM user_recovery_codes WHERE user_id = $1 AND code = $2 RETURNING *`, 
                            [ userId, codeHash ]
                        )

                        // If we failed to remove the row, then we can't
                        // verify. The code's still around and we don't want
                        // to allow it to be used twice.
                        if ( deleteResults.rows.length <= 0 || deleteResults.rows[0].code !== codeHash ) {
                            // Don't verify if we failed to remove the code.
                            this.core.logger.error(`Failed to remove recovery code after verification. No rows returned.`)
                            return false
                        } else {
                            return true
                        }
                    } catch (error) {
                        // Don't verify if we failed to remove the code.
                        this.core.logger.error(`Failed to remove recovery code after verification: `, error)
                        return false
                    }
                }
            }

            return false 
        } catch (error) {
            this.core.logger.error(`Failed to verify recovery code: `, error)
            return false
        }
    }
}
