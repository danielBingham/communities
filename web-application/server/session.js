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

const session = require('@communities/session')
const pgSession = require('connect-pg-simple')(session)

const createSessionParser = function(core) {
    core.logger.info('Initializing the session parser...')
    const sessionStore = new pgSession({
        pool: core.database,
        createTableIfMissing: true
    })
    const sessionParser = session({
        name: core.config.session.cookieName,
        headerName: core.config.session.headerName,
        platformHeader: core.config.session.platformHeader,
        secret: core.config.session.secret,
        store: sessionStore,
        logger: core.logger,
        resave: false,
        saveUninitialized: true,
        proxy: true,
        cookie: { 
            //domain: new URL('/', core.config.host).hostname,
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days 
        } 
    })

    return sessionParser
}

module.exports = {
    createSessionParser: createSessionParser 
}
