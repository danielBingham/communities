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
 * Creates the fixture users when a test run starts, and deletes them when it
 * ends.
 *
 * Every integration test script passes this file to Node's test runner with
 * --test-global-setup (see package.json). globalSetup runs once, in the
 * runner's own process, before any test file; globalTeardown runs once after
 * the last one, whether the tests passed, failed or were interrupted.
 *
 * Each fixture in fixtures/users.js is created through the web application's
 * POST /test/user, with a username and email unique to this run and a random
 * password. The test processes, which the runner starts after globalSetup,
 * get them all in the environment (see lib/fixtures.js), so the passwords are
 * never written anywhere.
 *
 * Teardown deletes them through DELETE /test/user/:id. If a run is killed
 * outright, its users are left behind: harmless, since nobody has their
 * passwords, and easy to spot, since their emails all start with
 * communities-test-<run>-.
 ******************************************************************************/

const crypto = require('node:crypto')

const { fetchEndpoint } = require('./lib/fetchEndpoint')
const { initialize } = require('./lib/authentication')
const { FIXTURES_VARIABLE } = require('./lib/fixtures')

const definitions = require('./fixtures/users')

// The users this run has created, for teardown: [{ key, id }].
const created = []

// The anonymous session the fixtures are created and deleted with.
let session = null

/**
 * Create one fixture. `fixtures` holds the ones already created, so a
 * moderation's `flaggedBy` can name an earlier one.
 */
const createFixture = async function(run, number, key, definition, fixtures) {
    // An invited user hasn't chosen a password yet.
    const password = definition.status === 'invited'
        ? undefined
        : crypto.randomBytes(24).toString('base64url')

    let siteModeration = undefined
    if ( definition.siteModeration ) {
        const flaggedBy = fixtures[definition.siteModeration.flaggedBy]
        if ( ! flaggedBy ) {
            throw new Error(`${key}: siteModeration.flaggedBy must name an earlier fixture, `
                + `but it's '${definition.siteModeration.flaggedBy}'.`)
        }
        siteModeration = { status: definition.siteModeration.status, flaggedBy: flaggedBy.id }
    }

    // Fields left undefined aren't sent, so the server's defaults apply.
    const response = await fetchEndpoint('POST', '/test/user', {
        session: session,
        body: {
            name: definition.name,
            username: `test-${run}-${key}`,
            email: `communities-test-${run}-${number}@mailinator.com`,
            password: password,
            status: definition.status,
            siteRole: definition.siteRole,
            multifactor: definition.multifactor,
            siteModeration: siteModeration
        }
    })

    if ( response.status === 404 && response.content?.error?.type === 'no-resource' ) {
        throw new Error(`The server has no POST /test/user, so it can't create the fixture users. `
            + `It only has it in local development and on staging.`)
    }
    if ( response.status !== 201 ) {
        throw new Error(`Couldn't create the fixture user '${key}': `
            + `${response.status} ${JSON.stringify(response.content)}`)
    }

    const user = response.content.entity
    created.push({ key: key, id: user.id })

    return {
        key: key,
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        password: password,
        status: user.status,
        siteRole: user.siteRole,
        multifactor: definition.multifactor ?? 'disabled'
    }
}

/**
 * Delete every fixture created so far. Returns the ones it couldn't delete,
 * as messages.
 */
const deleteFixtures = async function() {
    const failures = []

    // Taken off the list first, so a second call doesn't try them again.
    for (const { key, id } of created.splice(0).reverse()) {
        try {
            const response = await fetchEndpoint('DELETE', `/test/user/${id}`, { session: session })
            if ( ! response.ok ) {
                failures.push(`${key}, User(${id}): ${response.status} ${JSON.stringify(response.content)}`)
            }
        } catch (error) {
            failures.push(`${key}, User(${id}): ${error.message}`)
        }
    }

    return failures
}

// Node finds these two by reading `module.exports` without running it, so
// they stay named functions exported by name below. Written as methods in
// the object literal, they'd be skipped without a word.

async function globalSetup() {
    const run = crypto.randomBytes(4).toString('hex')
    const fixtures = {}

    try {
        session = await initialize()

        let number = 0
        for (const [key, definition] of Object.entries(definitions)) {
            number += 1
            fixtures[key] = await createFixture(run, number, key, definition, fixtures)
        }
    } catch (error) {
        // Don't leave half a set behind. The runner stops when this throws,
        // without calling globalTeardown.
        const failures = await deleteFixtures()
        if ( failures.length > 0 ) {
            console.error(`Also couldn't delete these fixture users:\n  ${failures.join('\n  ')}`)
        }
        throw error
    }

    process.env[FIXTURES_VARIABLE] = JSON.stringify(fixtures)
    console.log(`Created ${created.length} fixture users for test run ${run}.`)
}

async function globalTeardown() {
    const count = created.length
    if ( count === 0 ) {
        return
    }

    const failures = await deleteFixtures()
    if ( failures.length > 0 ) {
        // The runner doesn't show an error thrown here, so say it and fail
        // the run.
        console.error(`Couldn't delete ${failures.length} of the ${count} fixture users; `
            + `they're left on the server:\n  ${failures.join('\n  ')}`)
        process.exitCode = 1
        return
    }

    console.log(`Deleted the ${count} fixture users.`)
}

module.exports = { globalSetup, globalTeardown }
