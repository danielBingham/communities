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

const path = require('node:path')

const {  S3FileService } = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')
const NotFoundError = require('../Errors/NotFoundError')

module.exports = class FileController {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.s3 = new S3FileService(core)
    }

    /**
     * GET /file/:id/src
     *
     * Get the raw file source for display.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the file we wish to get.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getAsset(request, response) {
        const name = request.params.name

        if ( ! name || typeof name !== 'string' ) {
            throw new NotFoundError(`Invalid asset requested: ${name}.`)
        }

        const validAssets = [ 'daniel-headshot.jpg', 'intro-video.mp4' ]

        if ( ! validAssets.includes(name) ) {
            throw new NotFoundError(`Invalid asset requested: ${name}.`)
        }

        const assetPath = path.join('assets/', name)

        const hasFile = await this.s3.hasFile(assetPath)
        if ( ! hasFile ) {
            throw new NotFoundError(`Requested asset not found on S3: ${name}.`)
        }

        const url = await this.s3.getSignedUrl(assetPath)
        if ( url === null ) {
            throw new NotFoundError(`Failed to retrieve requested asset: ${name}.`)
        }

        response.redirect(url)
    }
}
