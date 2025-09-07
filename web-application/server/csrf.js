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

const createCSRFMiddleware = function(core) {
    return function(request, response, next) {

        if ( request.method === 'GET' ) {
            next()
            return
        }

        if ( ! ( 'csrfToken' in request.session ) 
            || request.session.csrfToken === undefined 
            || request.session.csrfToken === null ) 
        {
            request.logger.debug(`Expired session.`)
            response.status(401).json({
                error: {
                    type: 'session-expired',
                    message: 'Your session expired.  Please refresh your page and log back in.'
                }
            })
            return
        }

        const csrfToken = request.get('X-Communities-CSRF-Token')

        if ( csrfToken !== request.session.csrfToken ) {
            request.logger.warn(`
                Request arrived with an invalid CSRF Token.  Possible forged request. 
                    Submitted token: ${csrfToken} 
                    Stored Token: ${request.session.csrfToken}
            `)
            response.status(403).json({
                error: {
                    type: 'invalid-csrf',
                    message: 'Request rejected as a potential forged request. This is to protect you from attackers attempting to steal your account credentials. If this request was you, refresh the page and try again. If you continue to see this message, reach out to support at contact@communities.social.'
                }
            })
            return
        } 
        

        next() 
    }
}

module.exports = {
    createCSRFMiddleware: createCSRFMiddleware
}
