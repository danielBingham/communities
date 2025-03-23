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

module.exports = class ImageService {

    constructor(core) {
        this.core = core

        this.fileService = new S3FileService(core)
    }

    async resize(file, size) {
        const fileName = `${file.id}.${size}.${mime.getExtension(file.type)}`
        const tmpPath = `tmp/${fileName}`
        const targetPath = `files/${fileName}`

        const fileContents = await this.fileService.getFile(file.filepath)

        await sharp(fileContents)
            .resize({ width: size })
            .toFile(tmpPath)

        await this.fileService.uploadFile(tmpPath, targetPath)
        this.fileService.removeLocalFile(tmpPath)
    }

    async crop(file, crop) {
        // Load the original file into memory.
        const fileContents = await this.fileService.getFile(file.filepath)
        //const dimensions = imageSize(fileContents)
        // TODO This doesn't currently handle mapping the crop to the correct
        // size.  We're usually cropping images that are 200x200, but the
        // original image could be any size.  The crop comes in raw pixels (0 -
        // 200) and we need to scale it to the original image's size.  
        //
        // That's going to take more work.  So punting on cropping for now.

        // Keep the uncropped file by moving it to `files/id.orig.ext`
        const originalPath = `files/${file.id}.orig.${mime.getExtension(file.type)}`
        await this.fileService.moveFile(file.filepath, originalPath)

        // Crop the file and upload the cropped file to the original path.
        const filename = `${file.id}.${mime.getExtension(file.type)}`
        const tmpPath = `tmp/${filename}`
        const targetPath = `files/${filename}`

        await sharp(fileContents)
            .extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height })
            .toFile(tmpPath)

        await this.fileService.uploadFile(tmpPath, targetPath)
        this.fileService.removeLocalFile(tmpPath)
    }
}
