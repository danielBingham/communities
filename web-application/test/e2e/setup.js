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
 * The end-to-end tests' global setup: every test:e2e script passes this file
 * to Node's test runner with --test-global-setup (see package.json).
 *
 * It checks where the tests are pointed (lib/config.js refuses production,
 * and a BASE_URL and API_ROOT on different servers), that the browser is
 * installed, and that the server can do what the tests need of it, clears
 * the last run's results, and then creates the fixture users the same way
 * the integration tests do (../lib/setup.js), deleting them again at the
 * end.
 ******************************************************************************/

const fs = require('node:fs')

// First, so API_ROOT is settled before ../lib/setup.js reads it.
const config = require('./lib/config')

const shared = require('../lib/setup')
const { getInitialization } = require('../lib/system')
const { checkBrowserInstalled } = require('./lib/browser')

/**
 * Check that the server is set up for what the tests do, so a run that
 * can't pass fails before it starts, saying what to fix:
 *
 * - The browser hears that an image or a video it uploaded has been
 *   processed over the app's WebSocket, which the server only takes at
 *   /socket. With the WebSocket host anywhere else, attachments never
 *   finish processing as far as the post form knows.
 * - The post form only offers "Add Video" with the 'video-uploads' feature
 *   enabled.
 */
const checkServer = async function() {
    const initialization = await getInitialization()
    const problems = []

    const wsHost = initialization.config?.wsHost
    const wsPath = URL.canParse(wsHost) ? new URL(wsHost).pathname : null
    if ( wsPath !== '/socket' ) {
        problems.push(`The app's WebSocket host is '${wsHost}', but the server only takes WebSockets at `
            + `/socket, so the browser would never hear that an attached image or video had been processed. `
            + `Locally, set COMMUNITIES_WS_HOST=wss://localhost:3000/socket in your .env (see .env.local.example) `
            + `and restart the web application.`)
    }

    if ( initialization.features?.['video-uploads']?.status !== 'enabled' ) {
        problems.push(`Video uploads aren't enabled, so the post form won't offer "Add Video". `
            + `Enable the 'video-uploads' feature as a site admin, at /admin/features.`)
    }

    if ( problems.length > 0 ) {
        throw new Error(`${config.BASE_URL} isn't ready for the end-to-end tests:\n\n  - ${problems.join('\n  - ')}\n`)
    }
}

// Named functions exported by name, as ../lib/setup.js explains.

async function globalSetup() {
    checkBrowserInstalled()
    await checkServer()

    fs.rmSync(config.RESULTS_DIRECTORY, { recursive: true, force: true })

    console.log(`Running the end-to-end tests against ${config.BASE_URL} in ${config.BROWSER}.`)
    await shared.globalSetup()
}

async function globalTeardown() {
    await shared.globalTeardown()
}

module.exports = { globalSetup, globalTeardown }
