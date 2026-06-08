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
const { ImageService, FileDAO, ServiceError } = require('@communities/backend')

const getResizeImageJob = function(core) {
    return async function(job, done) {
        core.logger.id = `Image resize: ${job.id}`
        core.logger.info(`Beginning job 'resize-image' for user ${job.data.session.user.id} and file ${job.data.fileId}.`)

        const fileDAO = new FileDAO(core)
        try {
            job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })

            const imageService = new ImageService(core)

            let progress = 0
            for (const size of imageService.imageSizes) {
                await imageService.resize(job.data.fileId, size)

                progress += 20
                job.progress({ step: 'resizing', stepDescription: `Resizing...`, progress: progress })
            }

            await fileDAO.updateFile({ id: job.data.fileId, state: 'ready' })

            job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

            core.logger.info(`Finished job 'resize-image' for user ${job.data.session.user.id}.`)
            core.logger.id = 'core' 
            done(null)
        } catch (error) {
            core.logger.error(`Image processing error: `, error)
            try { 
                if ( error instanceof ServiceError ) {
                    // These are network errors which can be transient.
                    if ( error.type === 'failed-download' || error.type === 'failed-upload' || error.type === 'failed-read' ) {
                            job.progress({ step: 'failed', stepDescription: `We failed to process your image due to temporary network issues. If the error persists, please contact support.`, progress: 100})
                    }  else {
                        job.progress({ step: 'failed', stepDescription: 'Image failed to process. This could be because the file was corrupted or invalid in some way.', progress: 100 })
                    }
                } else {
                    job.progress({ step: 'failed', stepDescription: 'Image failed to process. This could be because the file was corrupted or invalid in some way.', progress: 100 })
                }

                await fileDAO?.updateFile({
                    id: job.data.fileId,
                    state: 'error'
                })
            } catch (secondError) {
                core.logger.error(`Failed job recovery error: `, secondError)
                job.progress({ step: 'failed', stepDescription: 'Image failed to process. This could be because the file was corrupted or invalid in some way.', progress: 100 })
            }
            done(error)
        }
    }
}

module.exports = getResizeImageJob
