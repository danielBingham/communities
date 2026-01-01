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
const { ImageService } = require('@communities/backend')

const getResizeImageJob = function(core) {
    return async function(job, done) {
        core.logger.id = `Image resize: ${job.id}`
        core.logger.info(`Beginning job 'resize-image' for user ${job.data.session.user.id} and file ${job.data.file.id}.`)

        try {

            job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })

            const imageService = new ImageService(core)

            let progress = 0
            for (const size of imageService.imageSizes) {
                await imageService.resize(job.data.file, size)

                progress += 20
                job.progress({ step: 'resizing', stepDescription: `Resizing...`, progress: progress })
            }

            job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

            core.logger.info(`Finished job 'resize-image' for user ${job.data.session.user.id}.`)
            core.logger.id = 'core' 
            done(null)
        } catch (error) {
            core.logger.error(error)
            done(error)
        }
    }
}

module.exports = getResizeImageJob
