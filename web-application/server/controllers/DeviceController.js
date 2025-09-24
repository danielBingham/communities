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

const { schema } = require('@communities/shared')

const BaseController = require('./BaseController')

module.exports = class DeviceController extends BaseController {

    constructor(core) {
        super(core)

        this.deviceSchema = new schema.DeviceSchema()
    }

    async patchDevice(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            return this.sendUserErrors(response, 401, {
                type: 'not-authenticated',
                log: `Unauthenticated user attempted to update device.`,
                message: `You cannot update device without authenticating.`
            })
        }

        const device = this.deviceSchema.clean(request.body)

        const errors = this.deviceSchema.validate(device)
        if ( errors.all.length > 0 ) {
            return this.sendUserErrors(response, 400, errors.all)
        }

        if ( ! ('device' in request.session ) ) {
            request.session.device = {}
        }

        request.session.device = {
            ...request.session.device,
            ...device
        }

        response.status(201).json({
            entity: request.session.device
        })
    }
}
