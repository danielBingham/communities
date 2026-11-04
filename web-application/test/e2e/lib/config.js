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
 * Where the end-to-end tests run, and how. Set in the environment (see
 * test/e2e/README.md):
 *
 *   BASE_URL        The site the browser opens. https://localhost:3000/ by
 *                   default; the npm scripts set it.
 *   API_ROOT        Where the fixture users are created and the tests seed
 *                   their data. Derived from BASE_URL, and if it's set, it
 *                   must be on the same server.
 *   E2E_BROWSER     'chromium' (the default), 'firefox' or 'webkit'.
 *   E2E_HEADED      'true' to watch the browser instead of running headless.
 *   E2E_SLOW_MO     Milliseconds to pause between browser actions.
 *   E2E_TIMEOUT     Milliseconds to wait for the page before failing.
 *   E2E_TRACE       'off' to skip recording Playwright traces.
 *
 * This is required before anything that loads ../../lib/fetchEndpoint.js
 * (test/e2e/setup.js does), so API_ROOT is set by the time it's read. The
 * test processes inherit it from the runner, where setup.js runs.
 ******************************************************************************/

const path = require('node:path')

const { refuseProduction } = require('../../lib/production')

const BASE_URL = new URL(process.env.BASE_URL ?? 'https://localhost:3000/').href
refuseProduction(BASE_URL, 'BASE_URL')

// The API is served from the same place as the pages.
if ( ! process.env.API_ROOT ) {
    process.env.API_ROOT = new URL('api/0.0.0/', BASE_URL).href
}

const { API_ROOT } = require('../../lib/fetchEndpoint')
refuseProduction(API_ROOT, 'API_ROOT')

// The fixture users are created through API_ROOT and log in to BASE_URL, so
// both have to be the same server.
if ( new URL(API_ROOT).origin !== new URL(BASE_URL).origin ) {
    throw new Error(`BASE_URL (${BASE_URL}) and API_ROOT (${API_ROOT}) are different servers. `
        + `The end-to-end tests create their users through API_ROOT and log in to BASE_URL as them. `
        + `Leave API_ROOT unset to use BASE_URL's.`)
}

const LOCAL_HOSTS = [ 'localhost', '127.0.0.1', '[::1]' ]

// A server on this machine serves a self-signed certificate (see
// documentation/running-locally.md), which the browser is told to accept.
const IS_LOCAL = LOCAL_HOSTS.includes(new URL(BASE_URL).hostname)

const BROWSERS = [ 'chromium', 'firefox', 'webkit' ]
const BROWSER = process.env.E2E_BROWSER ?? 'chromium'
if ( ! BROWSERS.includes(BROWSER) ) {
    throw new Error(`E2E_BROWSER is '${BROWSER}', but it must be one of: ${BROWSERS.join(', ')}.`)
}

const number = function(name, fallback) {
    const value = process.env[name] === undefined ? fallback : Number(process.env[name])
    if ( ! Number.isFinite(value) || value < 0 ) {
        throw new Error(`${name} must be a number of milliseconds, but it's '${process.env[name]}'.`)
    }
    return value
}

module.exports = {
    BASE_URL: BASE_URL,
    API_ROOT: API_ROOT,
    IS_LOCAL: IS_LOCAL,

    BROWSER: BROWSER,
    HEADED: process.env.E2E_HEADED === 'true',
    SLOW_MO: number('E2E_SLOW_MO', 0),

    // How long an action or a wait may take before the test fails. Staging
    // is further away, so it gets longer.
    TIMEOUT: number('E2E_TIMEOUT', IS_LOCAL ? 15000 : 30000),

    TRACE: process.env.E2E_TRACE !== 'off',

    // Screenshots and traces of the tests that failed in the last run.
    RESULTS_DIRECTORY: path.join(__dirname, '..', 'results'),

    VIEWPORTS: {
        desktop: { width: 1280, height: 900 },
        mobile: { width: 390, height: 844 }
    }
}
