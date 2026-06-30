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
const crypto = require('node:crypto')

const TokenDAO = require('../daos/TokenDAO')

const ServiceError = require('../errors/ServiceError')

const TOKEN_TTL = {
    'email-confirmation': 1000*60*60*24, // 1 day
    'reset-password': 1000*60*30, // 30 minutes
    'invitation': 1000*60*60*24*30 // 1 month
}

module.exports = class TokenService {

    static TYPE = {
        EMAIL_CONFIRMATION: 'email-confirmation',
        RESET_PASSWORD: 'reset-password',
        INVITATION: 'invitation'
    }

    constructor(core) {
        this.core = core

        this.tokenDAO = new TokenDAO(core)

        this.validTypes = {}
        for(const [key, value] of Object.entries(TokenService.TYPE)) {
            this.validTypes[value] = true
        }
    }

    /**
     * CSRF Tokens are handled differently, since they never go into the
     * database. Also, we're using longer ones for a little extra security.
     */
    createCSRFToken() {
        const buffer = crypto.randomBytes(32)
        const tokenContent = buffer.toString('base64url')
        return tokenContent
    }

    async createToken(token) {
        if ( ! ( token.type in this.validTypes) || this.validTypes[token.type] !== true ) {
            throw new ServiceError('invalid-type'
                `Attempt to create a token with invalid type, ${token.type}.`)
        }

        const buffer = crypto.randomBytes(32)
        const tokenContent = buffer.toString('base64url')

        const tokenHash = crypto.hash('sha256', tokenContent) 

        const tokenRow = {
            type: token.type,
            token: tokenHash,
            userId: 'userId' in token ? token.userId : null,
            creatorId: 'creatorId' in token ? token.creatorId: null
        }

        await this.tokenDAO.insertToken(tokenRow)

        return tokenContent 
    }

    async validateToken(tokenString, validTypes) {
        for(const type of validTypes ) {
            if ( ! (type in this.validTypes) || this.validTypes[type] !== true ) {
                throw new ServiceError('invalid-type',
                    `Attempt to validate a token with an invalid type, ${type}.`)
            }
        }

        // Rather than explicitly migrating and hashing all the tokens, we're
        // going to do a soft migration.  Since the longest lived tokens expire
        // after a month, we'll finish the migration at the end of the 30 day
        // period.
        //
        // This saves us having to do a pretty complex migration where we
        // create a temp table to hold the old tokens in order to allow us to
        // rollback the migration.
        const tokenHash = crypto.hash('sha256', tokenString)
        const tokens = await this.tokenDAO.selectTokens('WHERE tokens.token = $1 OR tokens.token = $2', [ tokenHash, tokenString ])

        if ( tokens.length <= 0 ) {
            throw new ServiceError('not-found',
                `Attempt to redeem a non-existent token.`)
        }

        if ( tokens.length > 1 ) {
            throw new ServiceError('invalid',
                `Found multiple tokens.  This is invalid.`)
        }

        const token = tokens[0] 

        if ( ! validTypes.includes(token.type) ) {
            throw new ServiceError('wrong-type', 
                `Attempt to redeem ${token.type} token as a ${validTypes.join(',')} token.`)
        }

        // Token lifespan.
        const createdDate = new Date(token.createdDate)
        const createdDateMs = createdDate.getTime()

        if ( (Date.now() - createdDateMs) > TOKEN_TTL[token.type]) {
            throw new ServiceError('expired',
                `Attempt to redeem an expired token.`)
        }

        return token
    }
}
