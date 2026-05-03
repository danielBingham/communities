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

const {
    MutualsDAO
} = require('@communities/backend')


const BaseController = require('./BaseController')
const ControllerError = require('../errors/ControllerError')

module.exports = class MutualsController extends BaseController {

    constructor(core) {
        super(core)

        this.mutualsDAO = new MutualsDAO(core)
    }

    async getRelations(currentUser, results, requestedRelations) { }

    async buildQuery(currentUser, request, options) {
        options = options || {
            ignorePage: false
        }

        const query = {
            where: ``,
            params: [],
            page: 1,
            order: '',
            fields: [],
            emptyResult: false,
            requestedRelations: request.query?.relations ? request.query.relations : []
        }

        if ( ! ( 'query' in request ) ) {
            return query
        }

        return query
    }

    async getMutuals(request, response) {

        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempting to query mutual relations.`,
                `You must log in to do that.`)
        }

        const results = await this.mutualsDAO.selectMutuals(currentUser)

        response.status(200).json({
            dictionary: results.dictionary 
        })
    }

}
