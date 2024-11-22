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

const DAOError = require('../errors/DAOError')

const TOKEN_TTL = {
    'email-confirmation': 1000*60*60*24, // 1 day
    'reset-password': 1000*60*30, // 30 minutes
    'invitation': 1000*60*60*24*30 // 1 month
}

module.exports = class TokenDAO {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
    }

    createToken(type) {
        const buffer = crypto.randomBytes(32)
        const token = {
            token: buffer.toString('hex'),
            type: type
        }
        return token
    }

    async validateToken(tokenString, validTypes) {
        const tokens = await this.selectTokens('WHERE tokens.token = $1', [ tokenString ])

        if ( tokens.length <= 0 ) {
            throw new DAOError('not-found',
                `Attempt to redeem a non-existent token.`)
        }

        const token = tokens[0] 

        if ( ! validTypes.includes(token.type) ) {
            throw new DAOError('wrong-type', 
                `Attempt to redeem ${token.type} token as a ${type} token.`)
        }

        // Token lifespan.
        const createdDate = new Date(token.createdDate)
        const createdDateMs = createdDate.getTime()

        if ( (Date.now() - createdDateMs) > TOKEN_TTL[token.type]) {
            throw new DAOError('expired',
                `Attempt to redeem an expired token.`)
        }

        return token
    }

    hydrateTokens(rows) {
        const dictionary = {}
        const list = []

        for ( const row of rows ) {
            const token = {
                id: row.token_id,
                userId: row.token_userId,
                creatorId: row.token_creatorId,
                token: row.token_token,
                type: row.token_type,
                createdDate: row.token_createdDate,
                updatedDate: row.token_updatedDate
            }

            if ( ! dictionary[token.id] ) {
                dictionary[token.id] = token
                list.push(token)
            }
        }

        return list
    }

    async selectTokens(where, params) {
        where = where ? where : ''
        params = params ? params : []

        const sql = `
            SELECT 
                tokens.id as token_id, 
                tokens.user_id as "token_userId", 
                tokens.creator_id as "token_creatorId",
                tokens.token as token_token, 
                tokens.type as token_type,
                tokens.created_date as "token_createdDate", 
                tokens.updated_date as "token_updatedDate"
            FROM tokens
            ${where}
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return []
        }

        return this.hydrateTokens(results.rows)
    }

    async insertToken(token) {
        const results = await this.database.query(`
            INSERT INTO tokens (user_id, creator_id, token, type, created_date, updated_date)
                VALUES ( $1, $2, $3, $4, now(), now())
                RETURNING id
        `, [ token.userId, token.creatorId, token.token, token.type ])

        if ( results.rows.length <= 0 ) {
            throw new DAOError('insert-failed', `Attempt to insert token failed.`)
        }

        return results.rows[0].id
    }

    async deleteToken(token) {
        const results = await this.database.query(`
            DELETE FROM tokens WHERE token=$1
        `, [ token.token ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('delete-failed', `Attempt to delete Token(${token.token}) failed.`)
        }
    }
}
