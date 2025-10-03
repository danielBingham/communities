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
        request.logger = new Logger(core.logger.level)
        request.logger.method = request.method
        request.logger.endpoint = request.originalUrl

        // Don't both logging the health requests.
        if ( request.url !== '/health' ) {
            // Log start and end of the request.
            const startTime = Date.now()
            request.logger.info(`BEGIN`)
            request.logger.verbose(`Host: ${request.host}, Hostname: ${request.hostname}`)
            request.logger.verbose(`Headers: `, request.headers)
            request.logger.verbose(`Body: `, request.body)
            response.once('finish', function() {
                request.logger.verbose(`Finishing ${request.method} ${request.url}`)
                const endTime = Date.now()
                const totalTime = endTime - startTime
                const contentSize = response.getHeader('content-length')

                request.logger.verbose(`Response Headers: `, response.getHeaders())
                request.logger.info(`END -- [ ${response.statusCode} ] -- ${totalTime} ms ${contentSize ? `${contentSize} bytes` : ''}`)
            })
        }

        next()
    }
}

const createLogIdMiddleware = function(core) {
    return (request, response, next) => {
        if ( ! ( 'logger' in request ) ) {
            core.logger.warn(`No logger found in request!`)
            next()
            return
        }

        // Set the id the logger will use to identify the session.  We don't want to
        // use the actual session id, since that value is considered sensitive.  So
        // instead we'll just use a uuid.
        if ( 'session' in request ) {
            if ( 'user' in request.session ) {
                request.logger.userId = request.session.user.id
                request.logger.username = request.session.user.username
            }  

            if ( 'logId' in request.session ) {
                request.logger.sessionId = request.session.logId
            } else if ( ! ( 'logId' in request.session ) ) {
                request.session.logId = Uuid.v4()
                request.logger.sessionId = request.session.logId
            }
        } 
        next()
    }
}

module.exports = {
    createLogMiddleware: createLogMiddleware,
    createLogIdMiddleware: createLogIdMiddleware
}
