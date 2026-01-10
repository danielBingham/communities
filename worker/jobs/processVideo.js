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

const { VideoService, FileDAO } = require('@communities/backend')

const getProcessVideoJob = function(core) {
    return async function(job, done) {
        core.logger.id = `Process Video: ${job.id}`

        const currentUser = job.data.session.user
        core.logger.info(`Beginning job 'process-video' for User(${currentUser.id}) and File(${job.data.fileId}).`)

        try {
            job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })


            const videoService = new VideoService(core)
            await videoService.process(currentUser, job.data.fileId)

            const fileDAO = new FileDAO(core)
            await fileDAO.updateFile({
                id: job.data.fileId,
                state: 'ready'
            })

            job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

            core.logger.info(`Finished job 'process-video' for User(${currentUser.id}).`)
            core.logger.id = 'core' 
            done(null)
        } catch (error) {
            core.logger.error(error)
            done(error)
        }
        
    }
}

module.exports = getProcessVideoJob
