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
 * and a BASE_URL and API_ROOT on different servers) and that the browser is
 * installed, clears the last run's results, and then creates the fixture
 * users the same way the integration tests do (../lib/setup.js), deleting
 * them again at the end.
 ******************************************************************************/

const fs = require('node:fs')

// First, so API_ROOT is settled before ../lib/setup.js reads it.
const config = require('./lib/config')

const shared = require('../lib/setup')
const { checkBrowserInstalled } = require('./lib/browser')

// Named functions exported by name, as ../lib/setup.js explains.

async function globalSetup() {
    checkBrowserInstalled()

    fs.rmSync(config.RESULTS_DIRECTORY, { recursive: true, force: true })

    console.log(`Running the end-to-end tests against ${config.BASE_URL} in ${config.BROWSER}.`)
    await shared.globalSetup()
}

async function globalTeardown() {
    await shared.globalTeardown()
}

module.exports = { globalSetup, globalTeardown }
