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
    Config,
    FeatureFlags,

    FeatureService,
} = require('@communities/backend')

const getResizeImageJob = require('./jobs/resizeImage')
const getSendNotificationsJob = require('./jobs/sendNotifications')
const getProcessVideoJob = require('./jobs/processVideo')

const configDefinition = require('./config')

const queue = process.argv[2]

async function initialize() {

    const environmentName = process.env.ENVIRONMENT_NAME
    const region = process.env.AWS_REGION
    const credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }

    const configLoader = new Config(environmentName, region, credentials)
    const config = await configLoader.loadConfig(configDefinition)

    const core = new Core('worker', config)

    await core.initialize()

    const featureService = new FeatureService(core)
    const features = await featureService.getEnabledFeatures()
    core.features = new FeatureFlags(features)

    if ( queue === 'resize-image' ) {
        core.queues['resize-image'].process(getResizeImageJob(core))
    } else if ( queue === 'process-video' ) {
        core.queues['process-video'].process(getProcessVideoJob(core))
    } else if ( queue === 'send-notifications' ) {
        core.queues['send-notifications'].process(100, getSendNotificationsJob(core))
    } else {
        core.queues['send-notifications'].process(100, getSendNotificationsJob(core))
        core.queues['process-video'].process(getProcessVideoJob(core))
        core.queues['resize-image'].process(getResizeImageJob(core))
    }

    core.logger.info(`Initialized and listening to queue '${queue}'...`)

    return core
}

initialize().then(function(core) {
    const shutdown = async function() {
        core.logger.info('Attempting a graceful shutdown...')
        await core.shutdown() 
        process.exit(0)
    }

    // We've gotten the termination signal, attempt a graceful shutdown.
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
}).catch(function(error) {
    console.error(error)
    process.exit(1)
})

