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
 * Getting around the app: opening pages, the header, logging in and out
 * through the UI.
 *
 * Like the rest of test/e2e/lib, these find things the way a person (or a
 * screen reader) does, by role and accessible name, so they don't break when
 * markup or class names change. Playwright waits for each element before it
 * acts on it, up to config.TIMEOUT.
 ******************************************************************************/

/**
 * The header's account menu, which only a logged in user has.
 */
const accountMenu = function(page) {
    return page.getByRole('banner').getByRole('button', { name: 'Account Menu' })
}

/**
 * Open `path` and wait for the app to have loaded it, logged in.
 */
const openPage = async function(page, path) {
    await page.goto(path)
    await accountMenu(page).waitFor()
}

/**
 * Follow one of the header's links: 'Feeds', 'Friends' or 'Groups'.
 */
const followHeaderLink = async function(page, name) {
    await page.getByRole('banner').getByRole('link', { name: name, exact: true }).click()
}

/**
 * Log out through the account menu. The client clears local storage and
 * reloads the root page, logged out.
 */
const logOut = async function(page) {
    await accountMenu(page).click()
    await page.getByRole('menuitem', { name: 'Log Out' }).click()
    await page.getByRole('banner').getByRole('button', { name: 'Log In' }).waitFor()
}

/**
 * Log in as `fixture` through the login page.
 */
const logIn = async function(page, fixture) {
    await page.goto('/login')

    const form = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Log in to Communities' }) })
    await form.getByRole('textbox', { name: 'Email', exact: true }).fill(fixture.email)
    await form.getByRole('textbox', { name: 'Password', exact: true }).fill(fixture.password)
    await form.getByRole('button', { name: 'Log In' }).click()

    await accountMenu(page).waitFor()
}

module.exports = {
    accountMenu: accountMenu,
    openPage: openPage,
    followHeaderLink: followHeaderLink,
    logOut: logOut,
    logIn: logIn
}
