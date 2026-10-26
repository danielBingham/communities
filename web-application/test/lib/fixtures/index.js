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
 * The fixture users this test run created, as the tests see them.
 *
 * ../setup.js creates them before any test file runs and hands them to every
 * test process in the environment variable FIXTURES_VARIABLE, as JSON keyed
 * like users.js. Each one carries what the run generated for it:
 *
 *   { key, id, name, username, email, password, status, siteRole, multifactor,
 *     multifactorSecret, recoveryCodes }
 *
 * `password` is undefined for an invited user, who has none.
 * `multifactorSecret` (the TOTP secret, for ../multifactor.js) and
 * `recoveryCodes` (ten, single-use) are only there for a fixture with
 * multi-factor authentication enabled.
 ******************************************************************************/

const FIXTURES_VARIABLE = 'COMMUNITIES_TEST_FIXTURES'

let fixtures = null

const loadFixtures = function() {
    if ( fixtures === null ) {
        const json = process.env[FIXTURES_VARIABLE]
        if ( ! json ) {
            throw new Error(`This test run has no fixture users. Run the tests through `
                + `'npm run test:integration' or 'npm run test:e2e' (or their :staging and `
                + `:single variants), whose setup creates them; see test/lib/README.md.`)
        }
        fixtures = JSON.parse(json)
    }
    return fixtures
}

/**
 * The fixture with this key from users.js, as this run created it.
 */
const getFixture = function(key) {
    const all = loadFixtures()
    if ( ! ( key in all ) ) {
        throw new Error(`There's no fixture user '${key}'; see test/lib/fixtures/users.js.`)
    }
    return all[key]
}

module.exports = {
    FIXTURES_VARIABLE: FIXTURES_VARIABLE,
    getFixture: getFixture
}
