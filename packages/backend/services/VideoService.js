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

const FileDAO = require('../FileDAO')

const ProcessService = require('./ProcessService')
const S3FileService = require('./S3FileService')
const ServiceError = require('../errors/ServiceError')

class ProgressTracker {
    constructor() {
        this.listeners = []
    }

    triggerProgress(percent) {
        for(const listener of listeners) {
            listener(percent)
        }
    }

    onProgress(listener) {
        this.listeners.push(listener)
    }
}

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

        this.fileDAO = new FileDAO(core)

        this.processService = new ProcessService(core)
        this.fileService = new S3FileService(core)
    }


    async reformat(file) {
        const originalFilename= `${file.id}.${mime.getExtension(file.type)}`
        const newFilename = `${file.id}.mp4`

        const localOriginalFile = path.join('tmp/', originalFilename)
        const localNewFile = path.join('tmp/', newFilename)
       
        const originalPath = file.filepath
        const targetPath = path.join('files/', newFilename)

        await this.fileService.downloadFile(originalPath, localOriginalFile)

        const ffmpegArgs = [
            '-i', localOriginalFile,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-profile:v', 'high',
            '-level:v', '4.0',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            localNewFile,
        ]

        try { 
            await this.processService.run('ffmpeg', ffmpegArgs)
        } catch (error ) {
            try {
                this.fileService.removeLocalFile(localOriginalFile)
            } catch (inputError) {}

            try {
                this.fileService.removeLocalFile(localNewFile)
            } catch (outputError) {}

            throw error
        }

        // Upload newFilename to s3
        await this.fileService.uploadFile(localNewFile, targetPath)

        // Update File in the database with the new filename and mimetype
        const filePatch = {
            id: file.id,
            userId: file.userId,
            location: file.location,
            filepath: targetPath,
            type: mime.getType('mp4')
        }

        await this.fileDAO.updateFile(filePatch)

        // Remove originalFilename from S3
        await this.fileService.removeFile(originalPath)
        
        // Remove both newFilename and originalFilename from local files
        this.fileService.removeLocalFile(localOriginalFile)
        this.fileService.removeLocalFile(localNewFile)
    }

    resize(file) {

    }

}
