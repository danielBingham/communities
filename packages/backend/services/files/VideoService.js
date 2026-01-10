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
const mime = require('mime')
const uuid = require('uuid')

const FileDAO = require('../../daos/FileDAO')

const ProcessService = require('../ProcessService')
const FileService = require('../FileService')
const LocalFileService = require('./LocalFileService')
const S3FileService = require('./S3FileService')
const ServiceError = require('../../errors/ServiceError')

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

    static SUPPORTED_MIMETYPES = [ 
        'video/mp4', // mp4
        'video/quicktime', // mov
        'video/x-msvideo', // avi
        'video/webm' // webm

    ]

    static SUPPORTED_EXTENSIONS = [ '.mp4', '.mov', '.avi', '.webm' ]

    constructor(core) {
        this.core = core

        this.fileDAO = new FileDAO(core)

        this.processService = new ProcessService(core)

        this.fileService = new FileService(core)

        this.local = new LocalFileService(core)
        this.s3 = new S3FileService(core)
    }


    async process(currentUser, fileId) {
        const file = await this.fileDAO.getFileById(fileId)

        const originalFilename = this.fileService.getFilename(file, 'original') 
        const newFilename = this.fileService.getFilename(file, undefined, 'video/mp4') 

        const localOriginalFile = path.join('tmp/', originalFilename)
        const localNewFile = path.join('tmp/', newFilename)
       
        const originalPath = file.filepath
        const targetPath = this.fileService.getPath(file, undefined, 'video/mp4') 

        this.core.logger.info(`Downloading file "${originalPath}"...`)
        await this.s3.downloadFile(originalPath, localOriginalFile)

        try { 
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
                '-vf', 'scale=650:-1',
                localNewFile,
            ]
            this.core.logger.info(`Reformatting file "${localOriginalFile}" to "${localNewFile}"...`)
            await this.processService.run('ffmpeg', ffmpegArgs)

            this.core.logger.info(`Uploading the newly formatted file...`)
            await this.s3.uploadFile(localNewFile, targetPath)

            const thumbId = uuid.v4()
            await this.fileDAO.insertFiles({
                id: uuid.v4(),
                userId: file.userId,
                type: 'image/jpeg',
                kind: 'image',
                mimetype: 'image/jpeg'
            })
            const thumbFile = await this.fileDAO.getFileById(thumbId)

            const thumbnailLocalFile = path.join('tmp/', this.fileService.getFilename(thumbFile))
            const thumbnailPath = this.fileService.getPath(file) 

            const ffmpegThumbnailArgs = [
                '-ss', '00:00:01.000', // Seek before input for accuracy
                '-i', localOriginalFile,
                '-vframes', '1', // Extract exactly one frame
                '-q:v', '2', // Output quality (JPEG quality, 1-31, lower is better)
                '-f', 'image2', // Force image2 format
               thumbnailLocalFile 
            ]
            this.core.logger.info(`Generating thumbnail...`)
            await this.processService.run('ffmpeg', ffmpegThumbnailArgs)

            this.core.logger.info(`Uploading the thumbnail...`)
            await this.s3.uploadFile(thumbnailLocalFile, thumbnailPath)

            const thumbPatch = {
                id: thumbId,
                filepath: thumbnailPath,
                location: this.config.s3.bucket_url
            }
            await this.fileDAO.updateFile(thumbPatch)

            const job = await this.core.queue.add('resize-image', { session: { user: currentUser }, fileId: thumbId })

            // Update File in the database with the new filename and mimetype
            const filePatch = {
                id: file.id,
                filepath: targetPath,
                mimetype: mime.getType('mp4'),
                type: mime.getType('mp4'),
                thumbId: thumbId
            }
            await this.fileDAO.updateFile(filePatch)

            if ( targetPath !== originalPath ) {
                this.core.logger.info(`Deleting the original...`)
                // Once we've updated the file to point to the newly formatted
                // file, delete the original to save space.  We're not going to use
                // it once we've reformatted it.
                await this.s3.removeFile(originalPath)
            }
        } catch (error ) {
            try {
                if ( this.local.fileExists(localOriginalFile) ) {
                    this.local.removeFile(localOriginalFile)
                }
            } catch (inputError) {
                this.core.logger.error(`Failed to clean up local original file: `, inputError)
            }

            try {
                if ( this.local.fileExists(localNewFile) ) {
                    this.local.removeFile(localNewFile)
                }
            } catch (outputError) {
                this.core.logger.error(`Failed to clean up local new file: `, outputError)
            }

            this.core.logger.error(`Attempt to reformat file failed: `, error)
            throw error
        }
        
        // Remove both newFilename and originalFilename from local files
        this.local.removeFile(localOriginalFile)
        this.local.removeFile(localNewFile)
    }
}
