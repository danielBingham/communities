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

const config = require('./config')

/**
 * Retry `check` until it stops throwing, and return what it returns. If it's
 * still throwing after `timeout` milliseconds, throw its last error.
 *
 * The page changes on its own time, so an assertion about it (node:assert,
 * which doesn't wait) goes in here:
 *
 *     await eventually(async () => assert.equal(await textbox.inputValue(), draft))
 *
 * To wait for an element to appear or go, use Playwright's
 * `locator.waitFor({ state })` instead.
 */
const eventually = async function(check, { timeout = config.TIMEOUT, interval = 100 } = {}) {
    const deadline = Date.now() + timeout
    for (;;) {
        try {
            return await check()
        } catch (error) {
            if ( Date.now() >= deadline ) {
                throw error
            }
        }
        await new Promise((resolve) => setTimeout(resolve, interval))
    }
}

module.exports = {
    eventually: eventually
}
