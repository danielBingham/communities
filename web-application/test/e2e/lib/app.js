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
 * Getting around the app: opening pages, the header and its notification
 * menu, logging in and out through the UI.
 *
 * Like the rest of test/e2e/lib, these find things the way a person (or a
 * screen reader) does, by role and accessible name, so they don't break when
 * markup or class names change. Playwright waits for each element before it
 * acts on it, up to config.TIMEOUT.
 *
 * Across test/e2e/lib, a function named get...() returns something from the
 * page, usually a Playwright Locator for the test to act on or check, and
 * does nothing to the page. The rest are actions.
 ******************************************************************************/

const config = require('./config')
const { eventually } = require('./wait')

// How long to wait for a notification to arrive: the worker sends them, on
// its own time.
const NOTIFICATION_TIMEOUT = Math.max(config.TIMEOUT, 30000)

/**
 * Get the button that opens the header's account menu, which only a logged in
 * user has.
 */
const getAccountMenuButton = function(page) {
    return page.getByRole('banner').getByRole('button', { name: 'Account Menu' })
}

/**
 * Get the button that opens the header's notification menu. Its accessible
 * name counts what's unread: 'Notifications, 2 unread', or just
 * 'Notifications'.
 */
const getNotificationsButton = function(page) {
    return page.getByRole('banner').getByRole('button', { name: /^Notifications\b/ })
}

/**
 * Get the notifications in the header's notification menu, once it's open,
 * whose text includes `text` (a string or a RegExp). Each says what happened,
 * like 'Test User2 mentioned you in their comment, "...", on a post by Test
 * User1, "...".', and follows a link to it when clicked.
 */
const getNotifications = function(page, text) {
    return page.getByRole('banner').getByRole('menuitem').filter({ hasText: text })
}

/**
 * Open `path` and wait for the app to have loaded it, logged in.
 */
const openPage = async function(page, path) {
    await page.goto(path)
    await getAccountMenuButton(page).waitFor()
}

/**
 * Open `path` (the feed, by default) and the header's notification menu, with
 * the user's notifications loaded. Until they are, the menu says "No
 * notifications.", so this waits for the app to have them before opening it:
 * then what the menu shows, and doesn't, is what the user has been sent.
 */
const openNotifications = async function(page, path = '/') {
    const loaded = page.waitForResponse((response) => response.request().method() === 'GET'
        && new URL(response.url()).pathname.endsWith('/notifications'))
    await openPage(page, path)
    await loaded
    await getNotificationsButton(page).click()
    await page.getByRole('banner').getByRole('menuitem', { name: 'Mark All Read', exact: true }).waitFor()
}

/**
 * Wait for `notification` (from getNotifications()) to arrive, and leave the
 * notification menu open on it. The worker sends notifications, so one may
 * take a moment: this opens the menu again, on a fresh page, until it's
 * there.
 */
const waitForNotification = async function(page, notification) {
    await eventually(async () => {
        await openNotifications(page)
        await notification.first().waitFor({ timeout: 1000 })
    }, { timeout: NOTIFICATION_TIMEOUT })
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
    await getAccountMenuButton(page).click()
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

    await getAccountMenuButton(page).waitFor()
}

module.exports = {
    getAccountMenuButton: getAccountMenuButton,
    getNotificationsButton: getNotificationsButton,
    getNotifications: getNotifications,
    openPage: openPage,
    openNotifications: openNotifications,
    waitForNotification: waitForNotification,
    followHeaderLink: followHeaderLink,
    logOut: logOut,
    logIn: logIn
}
