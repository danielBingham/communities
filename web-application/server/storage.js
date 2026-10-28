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

/******************************************************************************
 *      Stored Files (filesystem storage driver)
 *
 * The filesystem storage driver hands out signed links to
 * FilesystemStorage.ROUTE, its stand-in for S3's presigned URLs. This route
 * checks a link's signature and expiry and sends the file, including Range
 * requests, which video playback needs.
 *
 * It's only mounted when the filesystem driver is in use, which is only
 * allowed in development.
 ******************************************************************************/

const mime = require('mime')

const { FilesystemStorage } = require('@communities/backend')

const mountStorageRoute = function(app, core) {
    core.logger.info(`Serving stored files on '${FilesystemStorage.ROUTE}'.`)

    app.get(`${FilesystemStorage.ROUTE}/*key`, function(request, response) {
        const key = request.params.key.join('/')

        // As with S3, a missing, wrong or expired signature is a 403.
        if ( ! core.storage.verify(key, request.query.expires, request.query.signature) ) {
            response.status(403).send()
            return
        }

        let file = null
        try {
            file = core.storage.pathFor(key)
        } catch (error) {
            response.status(404).send()
            return
        }

        // Set the type ourselves: Express's own lookup sends .mp4 as
        // application/mp4, which some browsers won't play.
        response.type(mime.getType(file) ?? 'application/octet-stream')
        response.sendFile(file, function(error) {
            if ( error && ! response.headersSent ) {
                response.status(error.status ?? 404).send()
            }
        })
    })
}

module.exports = {
    mountStorageRoute: mountStorageRoute
}
