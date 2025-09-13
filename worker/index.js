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

const { 
    Core, 
    FeatureFlags,

    FeatureService,
    ImageService,
    NotificationService

} = require('@communities/backend')

const config = require('./config')

const core = new Core('worker', config)

async function initialize() {

    await core.initialize()

    const featureService = new FeatureService(core)
    const features = await featureService.getEnabledFeatures()
    core.features = new FeatureFlags(features)
 
    core.queue.process('resize-image', async function(job, done) {
        core.logger.id = `Image resize: ${job.id}`
        core.logger.info(`Beginning job 'resize-image' for user ${job.data.session.user.id} and file ${job.data.file.id}.`)

        const imageService = new ImageService(core)

        try {
            job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })

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
    })

    core.queue.process('send-notifications', async function(job, done) {
        core.logger.id = `send-notifications: ${job.id}`
        core.logger.info(`Beginning job 'send-notifications' of '${job.data.type}' for User(${job.data.currentUser.id}).`)
        core.logger.info(`Data: `, job.data)

        const notificationService = new NotificationService(core)

        try {
            job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })
            
            await notificationService.triggerNotifications(job.data.currentUser, job.data.type, job.data.context, job.data.options)

            job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

            core.logger.info(`Finished job 'send-notifications' of '${job.data.type}' for user ${job.data.currentUser.id}.`)
            core.logger.id = 'core' 
            done(null)
        } catch (error) {
            core.logger.error(error)
            done(error)
        }
    })

    core.logger.info('Initialized and listening...')
}

initialize()

const shutdown = async function() {
    core.logger.info('Attempting a graceful shutdown...')
    await core.shutdown() 
    process.exit(0)
}

// We've gotten the termination signal, attempt a graceful shutdown.
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
