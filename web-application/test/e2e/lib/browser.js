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
 * The browser the end-to-end tests drive, and the fixture users' windows in
 * it.
 *
 * Each test file starts one browser (startBrowser() in `before`) and stops it
 * when it's done (stopBrowser() in `after`). A test opens a window for each
 * user it acts as with openAs(key): a Playwright browser context of its own,
 * with its own cookies and local storage, so two users can be open at once
 * and nothing one test leaves in local storage (a draft, say) reaches the
 * next. cleanUp(t), in `afterEach`, closes them all, and if the test failed,
 * saves a screenshot of each page and a Playwright trace of each window in
 * test/e2e/results/.
 *
 * Logging in: the browser uses the web platform, so the session is a cookie
 * and, unlike the integration tests' requests, its requests count against the
 * rate limits, which are per IP address (30 a minute for POST
 * /authentication). So openAs() logs each user in once per test file, through
 * the API the way the client does, and opens later windows with that
 * session's cookie. A test that logs out has to ask for a session of its own
 * ({ fresh: true }), or it would end the one the other windows share.
 ******************************************************************************/

const fs = require('node:fs')
const path = require('node:path')

const playwright = require('playwright')

const config = require('./config')

const { isProduction } = require('../../lib/production')
const { getFixture } = require('../../lib/fixtures')

let browser = null

// The windows opened since the last cleanUp(): [{ context, label }].
let windows = []

// Each fixture's session, as a Playwright storage state, by fixture key.
const sessions = new Map()

/**
 * Check that Playwright's copy of the browser is installed, so a run without
 * it fails before creating any fixtures, with the command that fixes it.
 */
const checkBrowserInstalled = function() {
    const executable = playwright[config.BROWSER].executablePath()
    if ( ! fs.existsSync(executable) ) {
        throw new Error(`The end-to-end tests need Playwright's ${config.BROWSER}, which isn't `
            + `installed (no ${executable}). From web-application, install it with:\n\n`
            + `  npx playwright install ${config.BROWSER}\n`)
    }
}

const startBrowser = async function() {
    browser = await playwright[config.BROWSER].launch({
        headless: ! config.HEADED,
        slowMo: config.SLOW_MO
    })
}

const stopBrowser = async function() {
    if ( browser !== null ) {
        await browser.close()
        browser = null
    }
    sessions.clear()
}

/**
 * Open a new browser context on BASE_URL. `viewport` is one of
 * config.VIEWPORTS (desktop by default); `storageState` is a session to open
 * it with; `label` names it in the results of a failed test.
 */
const newContext = async function({ viewport, storageState, label }) {
    if ( browser === null ) {
        throw new Error(`There's no browser: call startBrowser() in the test file's before().`)
    }

    const context = await browser.newContext({
        baseURL: config.BASE_URL,
        ignoreHTTPSErrors: config.IS_LOCAL,
        viewport: viewport ?? config.VIEWPORTS.desktop,
        storageState: storageState,
        // As if the user had already answered the client's "Show desktop
        // notifications?" prompt, which otherwise opens under the header's
        // notification menu on every page.
        permissions: [ 'notifications' ]
    })
    context.setDefaultTimeout(config.TIMEOUT)
    context.setDefaultNavigationTimeout(config.TIMEOUT)

    // Whatever the page asks for, a link it follows or an image it loads,
    // never reaches production.
    await context.route((url) => isProduction(url), (route) => route.abort('blockedbyclient'))

    if ( config.TRACE ) {
        await context.tracing.start({ screenshots: true, snapshots: true })
    }

    windows.push({ context: context, label: `${windows.length + 1}-${label}` })
    return context
}

/**
 * Log the fixture in to `context`'s cookie jar, as the client does: start a
 * session (the web platform keeps it in a cookie) and post the credentials
 * with the session's CSRF token.
 */
const logIn = async function(context, fixture) {
    const headers = {
        'Accept': 'application/json',
        'X-Communities-Platform': 'web'
    }

    const initialization = await context.request.get(new URL('system/initialization', config.API_ROOT).href, {
        headers: headers
    })
    if ( ! initialization.ok() ) {
        throw new Error(`Couldn't start a session to log in as '${fixture.key}': `
            + `${initialization.status()} ${await initialization.text()}`)
    }
    const { csrf } = await initialization.json()

    const authentication = await context.request.post(new URL('authentication', config.API_ROOT).href, {
        headers: { ...headers, 'X-Communities-CSRF-Token': csrf },
        data: { email: fixture.email, password: fixture.password }
    })
    if ( ! authentication.ok() ) {
        throw new Error(`Couldn't log in as '${fixture.key}': `
            + `${authentication.status()} ${await authentication.text()}`)
    }
}

/**
 * Open a window logged in as the fixture user with this key (from
 * test/lib/fixtures/users.js), and return `{ fixture, context, page }`.
 *
 * @param {string} key
 * @param {Object} options
 * @param {Object} options.viewport One of config.VIEWPORTS. Desktop by
 * default.
 * @param {boolean} options.fresh   Log in with a session of its own rather
 * than the one this file shares for this user. For tests that log out.
 */
const openAs = async function(key, options = {}) {
    const fixture = getFixture(key)
    const shared = options.fresh !== true

    const context = await newContext({
        viewport: options.viewport,
        storageState: shared ? sessions.get(key) : undefined,
        label: key
    })

    if ( ! shared || ! sessions.has(key) ) {
        await logIn(context, fixture)
        if ( shared ) {
            sessions.set(key, await context.storageState())
        }
    }

    const page = await context.newPage()
    return { fixture: fixture, context: context, page: page }
}

/**
 * The file name for a test, from its full name ('Create Post > Smoke Test >
 * As a user...').
 */
const fileName = function(name) {
    return name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 150)
}

/**
 * Close every window the test opened. If it failed, first save what they
 * showed: a screenshot of each page, and the window's trace, which
 * `npx playwright show-trace <file>` replays step by step.
 *
 * @param {TestContext} t   The test's context, which `afterEach` is given.
 */
const cleanUp = async function(t) {
    const failed = t?.passed === false
    const directory = failed ? path.join(config.RESULTS_DIRECTORY, fileName(t.fullName ?? t.name)) : null

    for (const { context, label } of windows.splice(0)) {
        try {
            if ( failed ) {
                fs.mkdirSync(directory, { recursive: true })
                for (const [ index, page ] of context.pages().entries()) {
                    await page.screenshot({ path: path.join(directory, `${label}-page-${index + 1}.png`), fullPage: true })
                }
            }
            if ( config.TRACE ) {
                await context.tracing.stop(failed ? { path: path.join(directory, `${label}-trace.zip`) } : undefined)
            }
        } catch (error) {
            console.error(`Couldn't record the '${label}' window of '${t?.name}': ${error.message}`)
        } finally {
            await context.close().catch(() => {})
        }
    }

    if ( failed ) {
        console.error(`Saved screenshots${config.TRACE ? ' and traces' : ''} of '${t.name}' in ${directory}`)
    }
}

module.exports = {
    checkBrowserInstalled: checkBrowserInstalled,
    startBrowser: startBrowser,
    stopBrowser: stopBrowser,
    openAs: openAs,
    cleanUp: cleanUp
}
