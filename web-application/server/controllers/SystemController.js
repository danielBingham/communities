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

const { TokenService } = require('@communities/backend')

const BaseController = require('./BaseController')

module.exports = class SystemController extends BaseController {

    constructor(core) {
        super(core)
    }

    async getInitialization(request, response) {
        const result = {
            version: process.env.npm_package_version,
            config: {
                wsHost: this.core.config.wsHost,
                log_level: this.core.config.log_level,
                stripe: {
                    portal: this.core.config.stripe.portal,
                    links: this.core.config.stripe.links
                }
            },
            features: this.core.features.features
        }

        // Only generate a new CSRF Token if we don't have one. Since we're
        // storing it in the session, we'll need to generate a new one
        // anytime we destroy the session, which is the desired behavior.
        if ( request.session?.csrfToken === undefined  || request.session?.csrfToken === null ) {
            const tokenService = new TokenService(this.core)
            request.session.csrfToken = tokenService.createToken()
        } 

        result.csrf = request.session.csrfToken

       response.status(200).json(result)
    }

    async postInitialization(request, response) {

    }

    async getVersion(request, response) {
        response.status(200).json({
            version: process.env.npm_package_version,
        })
    }
}
