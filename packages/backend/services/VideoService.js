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

const ProcessService = require('./ProcessService')
const S3FileService = require('./S3FileService')
const ServiceError = require('../errors/ServiceError')

module.exports = class VideoService {

    SUPPORTED_MIMETYPES = [ 
        'video/mp4', // mp4
        'video/quicktime', // mov
        'video/x-msvideo', // avi
        'video/webm' // webm

    ]

    SUPPORTED_EXTENSIONS = [ '.mp4', '.mov', '.avi', '.webm' ]

    constructor(core) {
        this.core = core

        this.processService = new ProcessService(core)
        this.fileService = new S3FileService(core)
    }

    async reformat(file) {
        const fileName = `${file.id}.${mime.getExtension(file.type)}`
        const mp4FileName = `${file.id}.mp4`

        const localFile = path.join('tmp/', fileName)
        await this.fileService.downloadFile(file.filepath, localFile)

        const ffmpegArgs = [
            '-i', fileName,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-profile:v', 'high',
            '-level:v', '4.0',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            mp4FileName,
        ]

        try { 
            await this.processService.run('ffmpeg', ffmpegArgs)
        } catch (error ) {
            try {
                this.fileService.removeLocalFile(localFile)
            } catch (inputError) {}

            try {
                this.fileService.removeLocalFile(mp4FileName)
            } catch (outputError) {}

            throw error
        }

        // Need to either record the original mimetype separately from the
        // final mimetype or need to update the mimetype to match the new type
        // and remove the original file.
        //
        // I think it probably makes sense to update the file to match the new
        // type and to remove the original file after we've confirmed new file
        // upload was successful.
    }

    resize(file) {

    }

}
