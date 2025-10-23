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

// Calculate rate limits as requests per minute
const PERIOD = 60 * 1000

const rateLimit = function(core, limit) {
    return async function(request, response, next) {
        const route = request.route.path.replaceAll('/', '-')
        const method = request.method

        if ( limit === undefined || limit === null || typeof limit !== 'number' ) {
            next()    
        }

        if ( route === undefined || route === null || method === undefined || method === null) {
            next()    
        }

        const ipAddress = request.ip

        let previousRequestsJSON = await core.redis.get(`web-application:${route}:${method}:requests:${ipAddress}`)
        let previousRequests = {}
        if ( previousRequestsJSON !== null ) {
            previousRequests = JSON.parse(previousRequestsJSON)
        } 

        const now = Date.now()
        let requestCount = 0
        for(const [timestamp, previousRequest] of Object.entries(previousRequests)) {
            if ( now - timestamp > PERIOD ) {
                delete previousRequests[timestamp]
                continue
            }
            requestCount += 1
        }

        const userId = request.session.user?.id
        previousRequests[now] = {
            userId: userId || null
        }
        await core.redis.set(`web-application:${route}:${method}:requests:${ipAddress}`, JSON.stringify(previousRequests))

        request.logger.debug(`IP(${ipAddress}) has made ${requestCount} requests to ${method} ${route} against ${limit} in the last ${PERIOD / 1000} seconds.`)
        if ( requestCount > limit ) {
            request.logger.warn(`IP(${request.ip}) is being rate limited.`) 
            response.status(429).json({
                error: {
                    type: 'too-many-requests',
                    message: `You are submitting too many requests. Only ${limit} per ${PERIOD / 1000} seconds allowed.`
                }
            })
            return
        } 

        next() 
    }
}

module.exports = rateLimit
