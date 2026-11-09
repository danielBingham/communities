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
 * manual test suites (documentation/testing/README.md). Like those, they
 * nest: a Full Regression includes the Smoke Test.
 *
 *   full-regression   Every test.
 *   smoke-test        The cases in a case file's Smoke Test section.
 *
 * Each test is tagged with every suite it's in, on the test itself:
 *
 *     it('As a user, I should be able to make a post.', { tags: [ 'smoke-test', 'full-regression' ] }, ...)
 *     it('As a user, I should be able to post long strings ...', { tags: [ 'full-regression' ] }, ...)
 *
 * `npm run test:e2e:smoke-test` runs only the smoke-test tests, with Node's
 * `--experimental-test-tag-filter=smoke-test`. `npm run test:e2e`, a full
 * regression, runs every test without a filter; the full-regression tag
 * says so in the test.
 *
 * A tag filter leaves out every test without the tag, and says nothing about
 * it. Since every test is in the full regression, checkSuite(t), in each
 * file's `afterEach`, fails any test without the full-regression tag. That
 * catches a test someone forgot to tag, or tagged with a misspelling. More
 * tags for narrower suites (`permissions`, say) can go alongside it.
 ******************************************************************************/

const FULL_REGRESSION = 'full-regression'

/**
 * Throw unless the test that just ran is tagged as part of the full
 * regression, as every test is.
 *
 * @param {TestContext} t   The test's context, which `afterEach` is given.
 */
const checkSuite = function(t) {
    if ( ! t.tags.includes(FULL_REGRESSION) ) {
        throw new Error(`'${t.name}' must be tagged '${FULL_REGRESSION}', as every test is, `
            + `along with any other suite it's in: { tags: [ '${FULL_REGRESSION}' ] } or `
            + `{ tags: [ 'smoke-test', '${FULL_REGRESSION}' ] }. Its tags are ${JSON.stringify(t.tags)}. `
            + `See test/e2e/README.md.`)
    }
}

module.exports = {
    checkSuite: checkSuite
}
