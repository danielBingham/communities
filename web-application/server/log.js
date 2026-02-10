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
        let id = Uuid.v4()
        if ( 'session' in request ) {
            if ( 'user' in request.session ) {
                id = request.session.user.username

                if ( 'logId' in request.session ) {
                    core.logger.info(`${request.session.logId} -> ${id}`)
                    delete request.session.logId
                }
            }  else if ( 'logId' in request.session ) {
                id = request.session.logId
            } else if ( ! ( 'logId' in request.session ) ) {
                request.session.logId = id
            }
        } 

        // Create the request logger.
        request.logger = new Logger(core.logger.level, id, request.method, request.originalUrl)

        // Don't bother logging the health requests.
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


module.exports = {
    createLogMiddleware: createLogMiddleware,
}
