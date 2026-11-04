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
 * The suites the end-to-end tests are organized into, which follow the
 * manual test suites (documentation/testing/README.md):
 *
 *   smoke-test        The cases in a case file's Smoke Test section.
 *   full-regression   The rest: its Manual Regression and Full Regression
 *                     sections.
 *
 * Each test names its suite with a tag, on the test itself:
 *
 *     it('As a user, I should be able to make a post.', { tags: [ 'smoke-test' ] }, ...)
 *
 * `npm run test:e2e:smoke-test` runs only the smoke-test tests, with Node's
 * `--experimental-test-tag-filter=smoke-test`. A full regression, like the
 * manual one, is every test, both suites: `npm run test:e2e`, with no filter.
 *
 * A tag filter leaves out every test without the tag, and says nothing about
 * it. So a test without a suite would never be in a smoke test run, and a
 * misspelled tag would drop a smoke test without anyone noticing.
 * checkSuite(t), in each file's `afterEach`, fails any test that doesn't name
 * exactly one of the suites, so a full regression run catches it.
 ******************************************************************************/

const SUITES = [ 'smoke-test', 'full-regression' ]

/**
 * Throw unless the test that just ran is tagged with exactly one suite.
 *
 * @param {TestContext} t   The test's context, which `afterEach` is given.
 */
const checkSuite = function(t) {
    const suites = t.tags.filter((tag) => SUITES.includes(tag))
    if ( suites.length !== 1 ) {
        throw new Error(`'${t.name}' must be tagged with exactly one suite, `
            + `{ tags: [ '${SUITES.join(`' ] } or { tags: [ '`)}' ] }, but its tags are `
            + `${JSON.stringify(t.tags)}. See test/e2e/README.md.`)
    }
}

module.exports = {
    SUITES: SUITES,
    checkSuite: checkSuite
}
