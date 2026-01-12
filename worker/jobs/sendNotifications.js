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
const { Logger, NotificationWorker } = require('@communities/backend')

const getSendNotificationsJob = function(core) {
    return async function(job, done) {
        const logger = new Logger(core.logger.level, `send-notifications: ${job.id}`)
        logger.info(`Beginning job 'send-notifications' of '${job.data.type}' for User(${job.data.currentUser.id}).`)
        logger.verbose(`Data: `, job.data)

        try {
            job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })

            const notificationWorker = new NotificationWorker(core, logger)
            
            await notificationWorker.processNotification(job.data.currentUser, job.data.type, job.data.context, job.data.options)

            job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

            core.logger.info(`Finished job 'send-notifications' of '${job.data.type}' for user ${job.data.currentUser.id}.`)
            core.logger.id = 'core' 
            done(null)
        } catch (error) {
            core.logger.error(error)
            done(error)
        }

    }
}

module.exports = getSendNotificationsJob
