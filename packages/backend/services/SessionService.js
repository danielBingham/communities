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
module.exports = class SessionService {

    constructor(core) {
        this.core = core
    }


    async getSessions(userId) {
        const results = await this.core.database.query(`
            SELECT sid, sess FROM session
                WHERE (sess #>> '{user,id}')::uuid = $1
        `, [ userId ])

        let sessions = []
        if ( results.rows.length > 0 ) {
            for(const row of results.rows) {
                sessions.push({
                    id: row.sid,
                    data: row.sess
                })
            }
        }

        return sessions
    }

    async setSession(session) {
        const results = await this.core.database.query(`
            UPDATE session SET sess = $1 WHERE sid = $2
        `, [ session.data, session.id])

        if ( results.rowCount <= 0 ) {
            throw new Error('Failed to update session!')
        }
    }

    async deleteSessionsForUser(userId) {
        await this.core.database.query(`
            DELETE FROM session WHERE sess->'user'->>'id' = $1
        `, [ userId ])
    }

    async deleteSessionsForUserExcept(userId, sessionId) {
        await this.core.database.query(`
            DELETE FROM session WHERE sess->'user'->>'id' = $1 AND session.sid != $2
        `, [ userId, sessionId ])
    }

    async regenerateSession(request) {
        // Translate their csrf to the new session so that they don't have to
        // refresh and pull a new one.  If we don't do this, they'll get an
        // "authenticated" error which will trigger a redirect to the homepage
        // and a full refresh.
        //
        // The alternative is to generate a new CSRF Token, but in that case we
        // need some way to get it to the front end and they'll probably get a
        // CSRF mismatch error.
        //
        // TECHDEBT  We probably need a better way to handle this.
        const csrfToken = request.session.csrfToken
        const promise = new Promise((resolve, reject) => {
            request.session.regenerate((error) => {
                if ( error ) {
                    this.core.logger.error(`Failed to regenerate session: `, error)
                    reject()
                } else {
                    request.session.csrfToken = csrfToken
                    resolve()
                }
            })
        })

        return promise
    }
}
