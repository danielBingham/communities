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
const crypto = require('node:crypto')

const multer = require('multer')

const { VideoService, ImageService } = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

const storage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, 'public/uploads/tmp')
    },
    filename: (request, file, callback) => {
        // Generate a secure, unique filename to prevent collisions and path traversal
        const uniqueSuffix = crypto.randomBytes(16).toString('hex')
        const extension = path.extname(file.originalname).toLowerCase() || '.tmp' // Sanitize extension
        callback(null, `${Date.now()}-${uniqueSuffix}${extension}`)
    }
})

const createVideoUploadMiddleware = function() {
    return new multer({
        storage: storage,
        fileFilter: (request, file, callback) => {
            const fileExtension = path.extname(file.originalname).toLowerCase()
            if ( VideoService.SUPPORTED_MIMETYPES.includes(file.mimetype) && VideoService.SUPPORTED_EXTENSIONS.includes(fileExtension) ) {
                callback(null, true)
            } else {
                callback(new ControllerError(400, 'invalid',
                    `Attempt to upload a video with an unsupported type: '${file.mimetype}'.`,
                    `Unsupported video type or extension.  Supported types are: .mp4, .avi, .mov, and .webp`), false)
            }
        },
        limits: {
            fileSize: 700 * 1024 * 1024 // 700MB filesize limit (It's going to shrink a lot after we process it)
        }
    }).single('file')
}

const createImageUploadMiddleware = function() {
    return new multer({
        storage: storage,
        fileFilter: (request, file, callback) => {
            const fileExtension = path.extname(file.originalname).toLowerCase()
            if ( ImageService.SUPPORTED_MIMETYPES.includes(file.mimetype) && ImageService.SUPPORTED_EXTENSIONS.includes(fileExtension) ) {
                callback(null, true)
            } else {
                callback(new ControllerError(400, 'invalid',
                    `Attempt to upload an image with an unsupported type: '${file.mimetype}'.`,
                    `Unsupported image type or extension.  Supported types are: .jpg, .png`), false)
            }
        },
        limits: {
            fileSize: 20 * 1024 * 1024 // 20MB filesize limit
        }
    }).single('file')

}

module.exports = {
    createVideoUploadMiddleware: createVideoUploadMiddleware,
    createImageUploadMiddleware: createImageUploadMiddleware,
}
