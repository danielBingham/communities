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
const mime = require('mime')
const sharp = require('sharp')
const { imageSize } = require('image-size')

const S3FileService = require('./S3FileService')
const ServiceError = require('../errors/ServiceError')

module.exports = class ImageService {

    static SUPPORTED_MIMETYPES = [
        'image/jpeg',
        'image/png'
    ]

    static SUPPORTED_EXTENSIONS = [ '.jpg', '.jpeg', '.png' ]

    constructor(core) {
        this.core = core

        this.fileService = new S3FileService(core)

        this.imageSizes = [ 30, 200, 325, 450, 650 ] 
    }

    async resize(file, size) {
        const fileName = `${file.id}.${size}.${mime.getExtension(file.type)}`
        const tmpPath = `tmp/${fileName}`
        const targetPath = `files/${fileName}`

        const fileContents = await this.fileService.getFile(file.filepath)

        await sharp(fileContents)
            .rotate()
            .resize({ width: size })
            .toFile(tmpPath)

        await this.fileService.uploadFile(tmpPath, targetPath)
        this.fileService.removeLocalFile(tmpPath)
    }

    async crop(file, crop, renderedDimensions) {
        // Load the original file into memory.
        const fileContents = await this.fileService.getFile(file.filepath)

        let orientedContents = null
        try {
            orientedContents = await sharp(fileContents).rotate().toBuffer() 
        } catch ( error ) {
            this.core.logger.error(`Attempt to orient file before crop failed.\n
                file: %O\n
                crop: %O\n
                renderedDimensions: %O
            `, file, crop, renderedDimensions)
            throw error 
        }
        const dimensions = imageSize(orientedContents)
        
        // The image will have been scaled equivalently in each dimension in
        // order to maintain the aspect ratio. In theory, we should be able to
        // use the ratio from one dimension for both of them, but there are
        // rounding errors that can cause issues in large images.  So we need
        // the ratio from each dimension and to use it accordingly.
        const widthRatio = dimensions.width / parseInt(renderedDimensions.width)
        if ( widthRatio <= 0 ) {
            throw new ServiceError('validation-error',
                `Invalid widthRatio '${widthRatio}'.  Cannot crop.`)
        }

        const heightRatio = dimensions.height / parseInt(renderedDimensions.height)
        if ( heightRatio <= 0 ) {
            throw new ServiceError('validation-error',
                `Invalid heightRatio '${heightRatio}'.  Cannot crop.`)
        }


        const x = Math.floor(parseInt(crop.x) * widthRatio)
        const y = Math.floor(parseInt(crop.y) * heightRatio)
        if ( x === NaN || y === NaN ) {
            throw new ServiceError('validation-error',
                `X or Y of the crop is NaN after scaling.`)
        }

        // The Crop can come back less than zero, probably due to rounding
        // issues.  Zero it out when that happens.
        if ( x < 0 ) {
            x = 0
        }

        if ( y < 0 ) {
            y = 0
        }

        let width = Math.floor(parseInt(crop.width) * widthRatio)
        let height = Math.floor(parseInt(crop.height) * heightRatio )

        if ( width <= 0 ) {
            width = 1
        }

        if ( height <= 0 ) {
            height = 1
        }

        // Keep the uncropped file by moving it to `files/id.orig.ext`
        const originalPath = `files/${file.id}.orig.${mime.getExtension(file.type)}`
        await this.fileService.moveFile(file.filepath, originalPath)
        await this.deleteImageSizes(file)

        // Crop the file and upload the cropped file to the original path.
        const filename = `${file.id}.${mime.getExtension(file.type)}`
        const tmpPath = `tmp/${filename}`
        const targetPath = `files/${filename}`

        try { 
            await sharp(orientedContents)
                .extract({ left: x, top: y, width: width, height: height })
                .toFile(tmpPath)
        } catch (error) {
            this.core.logger.error(`=== ImageService:: Attempt to crop a file failed::\n
                file: %O\n
                dimensions: %O\n
                crop: %O\n
                renderedDimensions: %O\n
                widthRatio: ${widthRatio}, heightRatio: ${heightRatio}, x: ${x}, y: ${y}, width: ${width}, height: ${height}
            `, file, dimensions, crop, renderedDimensions)
            this.core.logger.error(error)
            throw error 
        }

        await this.fileService.uploadFile(tmpPath, targetPath)
        this.fileService.removeLocalFile(tmpPath)
    }

    async deleteImageSizes(file) {
        for(const size of this.imageSizes) {
            const filepath = `files/${file.id}.${size}.${mime.getExtension(file.type)}`
            this.fileService.removeFile(filepath)
        }
    }
}
