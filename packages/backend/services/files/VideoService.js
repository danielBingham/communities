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

class VideoProcess {
    constructor(core, currentUser, fileId) {
        this.core = core

        this.currentUser = currentUser
        this.fileId = fileId

        this.fileDAO = new FileDAO(core)

        this.processService = new ProcessService(core)

        this.fileService = new FileService(core)

        this.local = new LocalFileService(core)
        this.s3 = new S3FileService(core)

        this.events = {
            'progress': []
        }
    }

    on(event, handler) {
        if ( ! ( event in this.events) ) {
            throw new Error(`'${event}' is not a supported event.`)
        }

        this.events[event].push(handler)
    }

    trigger(event, data) {
        if ( ! (event in this.events) ) {
            throw new Error(`'${event}' is not a supported event.`)
        }

        for(const handler of this.events[event]) {
            handler(data)
        }
    }

    async run() {
        const file = await this.fileDAO.getFileById(this.fileId)

        const originalFilename = this.fileService.getFilename(file, 'original') 
        const newFilename = this.fileService.getFilename(file, undefined, 'video/mp4') 

        const localOriginalFile = path.join('tmp/', originalFilename)
        const localNewFile = path.join('tmp/', newFilename)

        let originalPath = file.filepath
        const targetPath = this.fileService.getPath(file, undefined, 'video/mp4') 

        this.trigger('progress', 2)

        try { 
            // TODO: Add retries to this.
            this.core.logger.info(`Downloading file "${originalPath}"...`)
            await this.s3.downloadFile(originalPath, localOriginalFile).catch((error) => {
                this.core.logger.error(`Failed to download video for processing: `, error)
                throw new ServiceError('failed-download', 'We failed to download the video for processing.')
            })

            this.trigger('progress', 10)

            if ( originalPath === targetPath ) {
                originalPath = this.fileService.getPath(file, 'original')
                this.core.logger.info(`Backing up original file to ${originalPath}...`)
                await this.s3.moveFile(file.filepath, originalPath)
            }

            // Get the length of the video in seconds.
            //
            // ffprobe -i <file> -show_entries format=duration -of csv=p=0
            const ffprobeArgs = [
                '-v', 'quiet',
                '-i', localOriginalFile,
                '-show_entries', 'format=duration',
                '-of', 'csv=p=0'
            ]
            const durationSecondsString = await this.processService.run('ffprobe', ffprobeArgs)
            const durationSeconds = parseFloat(durationSecondsString)
            if ( Number.isNaN(durationSeconds) ) {
                throw new ServiceError('unknown-length', 'Failed to determine video length.')
            }

            this.trigger('progress', 15)

            // Reformat and scale the video for web.
            //
            // ffmpeg -i <file> -c:v libx264 -preset medium -profile:v high -level:v 4.0 -crf 23 -c:a aac -b:a 128k -movflags +faststart -vf scale=650:-1 <file>
            const ffmpegArgs = [
                '-i', localOriginalFile,
                '-c:v', 'libx264',
                '-progress', 'pipe:1',
                '-preset', 'medium',
                '-profile:v', 'high',
                '-level:v', '4.0',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-vf', 'scale=650:-2',
                '-nostdin',
                '-y',
                localNewFile,
            ]
            this.core.logger.info(`Reformatting file "${localOriginalFile}" to "${localNewFile}"...`)
            const process = this.processService.spawn('ffmpeg', ffmpegArgs)

            // Read progress from stdout and report it on the 'progress' event.
            process.on('stdout', (data) => {
                try { 
                    // Convert into an object.
                    const parsedData = Object.fromEntries(data.split('\n').map((l) => l.split('=')))

                    // Calculate our progress. 
                    // * `out_time_ms` is in microseconds.
                    // * durationSeconds is in seconds.
                    const processedDurationSeconds = (parsedData.out_time_ms / (1000 * 1000)) 
                    
                    let processProgressPercentage = 0
                    if ( Number.isFinite(processedDurationSeconds) ) {
                        processProgressPercentage = (processedDurationSeconds / durationSeconds) * 100
                    }

                    const progressGainPercentage = Math.floor(processProgressPercentage * 0.6)

                    const progress = 20 + progressGainPercentage 

                    this.trigger('progress', progress)
                } catch (error) {
                    this.core.logger.error('Failed to parse ffmpeg progress report: ', error)
                }
            })

            this.trigger('progress', 20)
            await process.run()

            this.core.logger.info(`Checking size of the processed file...`)
            const size = this.local.getFileSize(localNewFile)
            // If the processed size is greater than 150 MB, error.
            if ( size > 150 * 1024 * 1024 ) {
                throw new ServiceError('processed-file-too-large', 'Processed files can be no larger than 150 MB.')
            }

            // TODO: Add retries to this.
            this.core.logger.info(`Uploading the newly formatted file...`)
            await this.s3.uploadFile(localNewFile, targetPath).catch((error) => {
                this.core.logger.error(`Failed to upload video after processing: `, error)
                throw new ServiceError('failed-upload', 'We failed to upload the video after processing.')
            })

            this.trigger('progress', 85)

            const thumbId = uuid.v4()
            await this.fileDAO.insertFiles({
                id: thumbId,
                userId: file.userId,
                type: 'image/jpeg',
                kind: 'image',
                mimetype: 'image/jpeg',
                variants: []
            })
            const thumbFile = await this.fileDAO.getFileById(thumbId)

            const thumbnailLocalFile = path.join('tmp/', this.fileService.getFilename(thumbFile))
            const thumbnailPath = this.fileService.getPath(thumbFile) 

            const ffmpegThumbnailArgs = [
                '-ss', '00:00:00.000', // Make sure we're grabbing the first frame.
                '-i', localOriginalFile,
                '-vframes', '1', // Extract exactly one frame
                '-q:v', '2', // Output quality (JPEG quality, 1-31, lower is better)
                '-f', 'image2', // Force image2 format
               thumbnailLocalFile 
            ]
            this.core.logger.info(`Generating thumbnail...`)
            await this.processService.run('ffmpeg', ffmpegThumbnailArgs)

            this.trigger('progress', 90)

            this.core.logger.info(`Uploading the thumbnail...`)
            await this.s3.uploadFile(thumbnailLocalFile, thumbnailPath).catch((error) => {
                this.core.logger.error(`Failed to upload video thumbnail after processing: `, error)
                throw new ServiceError('failed-thumbnail-upload', 'We failed to upload the video thumbnail after processing.')
            })

            this.trigger('progress', 95)

            const thumbPatch = {
                id: thumbId,
                filepath: thumbnailPath,
                location: this.core.config.s3.bucket_url
            }
            await this.fileDAO.updateFile(thumbPatch)

            const job = await this.core.queues['resize-image'].add({ session: { user: this.currentUser }, fileId: thumbId }, { attempts: 3 })

            // Update File in the database with the new filename and mimetype
            const filePatch = {
                id: file.id,
                filepath: targetPath,
                mimetype: mime.getType('mp4'),
                type: mime.getType('mp4'),
                thumbId: thumbId
            }
            await this.fileDAO.updateFile(filePatch)

            this.core.logger.info(`Deleting original file from path '${originalPath}'...`)
            // Once we've updated the file to point to the newly formatted
            // file, delete the original to save space.  We're not going to use
            // it once we've reformatted it.
            await this.s3.removeFile(originalPath)
        
            // Remove both newFilename and originalFilename from local files
            this.local.removeFile(localOriginalFile)
            this.local.removeFile(localNewFile)

            this.trigger('progress', 100)
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
    }
}


module.exports = class VideoService {

    static SUPPORTED_MIMETYPES = [ 
        'video/mp4', // mp4
        'video/quicktime', // mov
        //'video/x-msvideo', // avi
        //'video/webm' // webm

    ]

    static SUPPORTED_EXTENSIONS = [ '.mp4', '.mov', /*'.avi', '.webm'*/ ]

    constructor(core) {
        this.core = core
    }

    spawnVideoProcess(currentUser, fileId) {
        return new VideoProcess(this.core, currentUser, fileId)
    }
}
