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

const Uuid = require('uuid')
const { Logger } = require('@communities/backend') 

const createLogMiddleware = function(core) {
    return function(request, response, next) {

        // Set the id the logger will use to identify the session.  We don't want to
        // use the actual session id, since that value is considered sensitive.  So
        // instead we'll just use a uuid.
        let id = null
        if ( request.session.user ) {
            id = request.session.user.id
        } else {
            if ( request.session.logId ) {
                id = request.session.logId
            } else {
                request.session.logId = Uuid.v4()
                id = request.session.logId
            }
        }

        request.logger = new Logger(core.logger.level, id, request.method, request.originalUrl)

        // Don't both loggering the health requests.
        if ( request.url !== '/health' ) {
            // Log start and end of the request.
            const startTime = Date.now()
            request.logger.debug(`==================== BEGIN: ${request.method} ${request.url} ====================`)
            request.logger.debug(`Host: ${request.host}, Hostname: ${request.hostname}, SessionId: ${request.sessionID}`)
            request.logger.debug(`Cookies: `, request.cookies)
            request.logger.debug(`Headers: `, request.headers)
            request.logger.debug(`Session: `, request.session)
            response.once('finish', function() {
                const endTime = Date.now()
                const totalTime = endTime - startTime
                const contentSize = response.getHeader('content-length')

                request.logger.debug(`Response Headers: `, response.getHeaders())
                request.logger.debug(`==================== END: ${request.method} ${request.url} -- [ ${response.statusCode} ] -- ${totalTime} ms ${contentSize ? `${contentSize} bytes` : ''} ====================`)
            })
        }

        next()
    }
}

module.exports = {
    createLogMiddleware: createLogMiddleware 
}
