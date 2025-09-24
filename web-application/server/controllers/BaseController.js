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

module.exports = class BaseController {

    static METHODS = {
        QUERY: 'query',
        GET: 'get',
        POST: 'post',
        PATCH: 'patch',
        DELETE: 'delete'
    }

    constructor(core, entity, rateLimits) {
        this.core = core

        this.entity = entity || null
        this.rateLimits = rateLimits || null
    }

    async shouldRateLimit(method, request) {
        if ( this.rateLimits === undefined || this.rateLimits === null ) {
            return false
        }

        const limits = this.rateLimits[method]

        const ipAddress = request.ip

        let requestsJSON = await this.core.redis.get(`web-application:${this.entity}:${method}:requests:${ipAddress}`)
        let requests = {}
        if ( requestsJSON !== null ) {
            requests = JSON.parse(requestsJSON)
        } 

        const now = Date.now()
        let requestCount = 0
        for(const [timestamp, request] of Object.entries(requests)) {
            if ( now - timestamp > limits.period ) {
                delete requests[timestamp]
                continue
            }
            requestCount += 1
        }

        const userId = request.session.user?.id
        requests[now] = {
            userId: userId || null
        }
        await this.core.redis.set(`web-application:${this.entity}:${method}:requests:${ipAddress}`, JSON.stringify(requests))

        if ( requestCount > limits.numberOfRequests ) {
            return true
        }

        return false
    }

    sendUserErrors(response, status, errors) {
        if ( status < 400 || status > 499 ) {
            throw new Error(`'sendUserErrors' should only be used for user errors (400 - 499).`)
        }

        if ( Array.isArray(errors) ) {
            const returnedErrors = []
            for(const error of errors ) {
                this.core.logger.warn(error.log)
                returnedErrors.push({
                    type: error.type,
                    message: error.message,
                    context: error.context
                })
            }

            let type = 'invalid'
            if ( status === 401 ) {
                type = 'not-authenticated'
            } else if ( status === 403 ) {
                type = 'not-authorized'
            } else if ( status === 409 ) {
                type = 'conflict'
            }

            response.status(status).json({
                error: {
                    type: type,
                    all: returnedErrors
                }
            })
        } else {
            this.core.logger.warn(errors.log)

            // The log message is not intended to be shown to the user, so
            // construct a new error to return without it.
            const returnedError = {
                type: errors.type,
                message: errors.message,
                context: errors.context
            }
            response.status(status).json({
                error: returnedError
            })
        }
    }
}
