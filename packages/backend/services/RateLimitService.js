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

module.exports = class RateLimitService {

    static METHODS = {
        QUERY: 'query',
        GET: 'get',
        POST: 'post',
        PATCH: 'patch',
        DELETE: 'delete'
    }
    
    constructor(core, entity, limits) {
        this.core = core

        this.entity = entity || null
        this.limits = limits || null
    }

    async shouldRateLimit(request) {
        const method = request.method.toLowerCase()
        request.logger.debug(`Testing rate limit for ${this.entity} on ${method}.`)
        if ( this.limits === undefined || this.limits === null ) {
            return false
        }

        if ( this.entity === undefined || this.entity === null ) {
            return false
        }

        if ( ! ( method in this.limits ) ) {
            return false
        }

        const limits = this.limits[method]
        request.logger.debug(`Limits: `, limits)

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

}
