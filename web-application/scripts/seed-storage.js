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

/******************************************************************************
 * Puts placeholder copies of the splash assets into storage.
 *
 *   npm run storage:seed
 *
 * AssetController serves two files from storage: `assets/intro-video.mp4`
 * (the welcome notice's video) and `assets/daniel-headshot.jpg`. Staging and
 * production have the real ones; new local storage has neither, so this adds
 * the placeholders in ./placeholders. A file that's already there is left
 * alone, so a real asset is never replaced.
 *
 * Uses the web application's development configuration (the same file the
 * server loads), but loads only what the storage driver needs.
 ******************************************************************************/

const path = require('node:path')

const { Config, Logger, createStorage } = require('@communities/backend')

const ASSETS = [ 'daniel-headshot.jpg', 'intro-video.mp4' ]

const seed = async function() {
    const definition = require('../server/config')

    if ( definition.environment === 'production' ) {
        throw new Error(`Placeholder assets can't be seeded with the production configuration.`)
    }

    const loader = new Config(process.env.COMMUNITIES_ENVIRONMENT_NAME, process.env.AWS_REGION, {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })
    const config = await loader.loadConfig({
        environment: definition.environment,
        host: definition.host,
        storage: definition.storage
    })
    const storage = createStorage({ config: config, logger: new Logger() })

    console.log(`Seeding placeholder assets with the '${config.storage.driver}' storage driver...`)
    for (const name of ASSETS) {
        const key = `assets/${name}`
        if ( await storage.hasFile(key) ) {
            console.log(`  ${key} is already there; left alone.`)
        } else {
            await storage.uploadFile(path.join(__dirname, 'placeholders', name), key)
            console.log(`  ${key} added.`)
        }
    }
}

seed().catch(function(error) {
    console.error(error.message)
    process.exitCode = 1
})
