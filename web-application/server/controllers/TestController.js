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
 *      TestController
 *
 * Creates and deletes the users the integration tests log in as. A test run
 * creates every user it needs when it starts and deletes them when it ends
 * (see test/integration/README.md), so nothing is seeded ahead of time and no
 * password is kept in the repository.
 *
 * It can create the accounts registration can't: confirmed without an email,
 * banned, invited, a site moderator or admin, with multi-factor
 * authentication on, or with a moderation of their profile.
 *
 * LOCAL DEVELOPMENT AND STAGING ONLY. The router only loads it there, and it
 * refuses to be constructed for any other environment. Every request must
 * also carry the platform header set to 'test' (`X-Communities-Platform:
 * test`), as the integration tests' requests do.
 *
 * It only deletes users it could have created: their emails have to match
 * FIXTURE_EMAIL, which POST requires.
 ******************************************************************************/
const {
    AuthenticationService,
    NotificationWorker,
    SessionService,

    UserDAO
} = require('@communities/backend')

const BaseController = require('./BaseController')
const ControllerError = require('../errors/ControllerError')

// The only environments this controller may be loaded in.
const ENVIRONMENTS = [ 'development', 'staging' ]

// The value the platform header must have.
const TEST_PLATFORM = 'test'

// Every fixture's email, so DELETE can tell a fixture from a real account.
// Mailinator accepts anything, so whatever email a test run causes goes
// somewhere harmless.
const FIXTURE_EMAIL = /^communities-test-[a-z0-9-]+@mailinator\.com$/

// Registration's rule (ValidationService), lower case as registration stores it.
const USERNAME = /^[a-z][a-z0-9\-_]+$/

const STATUSES = [ 'confirmed', 'unconfirmed', 'invited', 'banned' ]
const SITE_ROLES = [ 'user', 'moderator', 'admin' ]
const MULTIFACTOR_STATES = [ 'disabled', 'enabled' ]
const SITE_MODERATION_STATUSES = [ 'flagged', 'approved', 'rejected' ]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The test runs generate their passwords; this only stops a weak one.
const MINIMUM_PASSWORD_LENGTH = 16

module.exports = class TestController extends BaseController {

    /**
     * Whether this controller may be loaded for the environment, the
     * configuration's `environment`.
     */
    static isAvailableIn(environment) {
        return ENVIRONMENTS.includes(environment)
    }

    constructor(core) {
        super(core)

        if ( ! TestController.isAvailableIn(core.config.environment) ) {
            throw new Error(`TestController is only for ${ENVIRONMENTS.join(' and ')}, `
                + `never '${core.config.environment}'.`)
        }

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.auth = new AuthenticationService(core)
        this.sessionService = new SessionService(core)

        this.userDAO = new UserDAO(core)
    }

    /**
     * Refuse any request that doesn't come from the integration tests.
     */
    checkPlatform(request) {
        const platform = request.get(this.config.session.platformHeader)
        if ( platform !== TEST_PLATFORM ) {
            throw new ControllerError(403, 'not-authorized',
                `${request.method} ${request.originalUrl} without the '${TEST_PLATFORM}' platform header.`,
                `Only the integration tests may manage test fixtures.`)
        }
    }

    /**
     * The settings every fixture starts with: email off for every
     * notification, the way the app's email toggle leaves them (web, desktop
     * and mobile stay on), and no 'info' or 'announcement' posts in the
     * feed, so the post tests start from a blank slate.
     */
    fixtureSettings() {
        const notifications = {}
        for (const type of NotificationWorker.notifications) {
            notifications[type] = { web: true, email: false, desktop: true, mobile: true }
        }
        return { notifications: notifications, showInfo: false, showAnnouncements: false }
    }

    /**
     * Check a POST /test/user body and fill in its defaults.
     *
     * @return {Object} The fixture to create.
     */
    validateFixture(body) {
        const errors = []

        if ( body === null || typeof body !== 'object' || Array.isArray(body) ) {
            throw new ControllerError(400, 'invalid',
                `POST /test/user with a body that isn't a single object.`,
                `Send one fixture as a JSON object.`)
        }

        const fixture = {
            name: body.name,
            username: body.username,
            email: body.email,
            password: body.password,
            status: body.status ?? 'confirmed',
            siteRole: body.siteRole ?? 'user',
            multifactor: body.multifactor ?? 'disabled',
            siteModeration: body.siteModeration ?? null
        }

        if ( typeof fixture.name !== 'string' || fixture.name.trim() === '' ) {
            errors.push(`'name' is required.`)
        }
        if ( typeof fixture.username !== 'string' || ! USERNAME.test(fixture.username) ) {
            errors.push(`'username' must be lower case letters, numbers, '-' and '_', starting with a letter.`)
        }
        if ( typeof fixture.email !== 'string' || ! FIXTURE_EMAIL.test(fixture.email) ) {
            errors.push(`'email' must look like communities-test-<anything>@mailinator.com.`)
        }
        if ( ! STATUSES.includes(fixture.status) ) {
            errors.push(`'status' must be one of: ${STATUSES.join(', ')}.`)
        }
        if ( ! SITE_ROLES.includes(fixture.siteRole) ) {
            errors.push(`'siteRole' must be one of: ${SITE_ROLES.join(', ')}.`)
        }
        if ( ! MULTIFACTOR_STATES.includes(fixture.multifactor) ) {
            errors.push(`'multifactor' must be one of: ${MULTIFACTOR_STATES.join(', ')}.`)
        }

        // An invited user hasn't chosen a password yet; everyone else has one.
        if ( fixture.status === 'invited' ) {
            if ( fixture.password !== undefined ) {
                errors.push(`An invited user has no password yet, so leave 'password' out.`)
            }
        } else if ( typeof fixture.password !== 'string' || fixture.password.length < MINIMUM_PASSWORD_LENGTH ) {
            errors.push(`'password' must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`)
        }

        if ( fixture.siteModeration !== null ) {
            const moderation = fixture.siteModeration
            if ( typeof moderation !== 'object' || ! SITE_MODERATION_STATUSES.includes(moderation.status) ) {
                errors.push(`'siteModeration.status' must be one of: ${SITE_MODERATION_STATUSES.join(', ')}.`)
            }
            if ( typeof moderation?.flaggedBy !== 'string' || ! UUID.test(moderation.flaggedBy) ) {
                errors.push(`'siteModeration.flaggedBy' must be the id of the user who flagged the profile.`)
            }
        }

        if ( errors.length > 0 ) {
            throw new ControllerError(400, 'invalid',
                `Invalid test fixture: ${errors.join(' ')}`,
                errors.join('\n'))
        }

        return fixture
    }

    /**
     * POST /test/user
     *
     * Create a test fixture user.
     *
     * @param {Object} request.body
     * @param {string} request.body.name
     * @param {string} request.body.username
     * @param {string} request.body.email   Must match FIXTURE_EMAIL.
     * @param {string} request.body.password    Required, except for an
     * invited user, who has none.
     * @param {string} request.body.status  (Optional) 'confirmed' (the
     * default), 'unconfirmed', 'invited' or 'banned'.
     * @param {string} request.body.siteRole    (Optional) 'user' (the
     * default), 'moderator' or 'admin'.
     * @param {string} request.body.multifactor (Optional) 'disabled' (the
     * default) or 'enabled'. Enabled without a secret, so logging in stops at
     * the pending step.
     * @param {Object} request.body.siteModeration  (Optional) A moderation of
     * the user's profile: `{ status, flaggedBy }`, where `status` is
     * 'flagged', 'approved' or 'rejected' and `flaggedBy` is a user's id.
     *
     * Responds 201 with `{ entity }`: the user, with every field.
     */
    async postUser(request, response) {
        this.checkPlatform(request)

        const fixture = this.validateFixture(request.body)

        const existing = await this.database.query(`
            SELECT id FROM users WHERE email = $1 OR username = $2
        `, [ fixture.email, fixture.username ])
        if ( existing.rows.length > 0 ) {
            throw new ControllerError(409, 'conflict',
                `Test fixture '${fixture.username}' conflicts with User(${existing.rows[0].id}).`,
                `A user with that email or username already exists.`)
        }

        if ( fixture.siteModeration !== null ) {
            const flagger = await this.database.query(`
                SELECT id FROM users WHERE id = $1
            `, [ fixture.siteModeration.flaggedBy ])
            if ( flagger.rows.length === 0 ) {
                throw new ControllerError(400, 'invalid',
                    `Test fixture '${fixture.username}' flagged by User(${fixture.siteModeration.flaggedBy}), who doesn't exist.`,
                    `'siteModeration.flaggedBy' must be the id of an existing user.`)
            }
        }

        // The user and the moderation of their profile, or neither.
        const client = await this.database.connect()
        let userId = null
        try {
            await client.query('BEGIN')

            // Registration checks the birthdate but doesn't save it, hence NULL.
            const inserted = await client.query(`
                INSERT INTO users (
                    email, name, username, password, birthdate, status, site_role, settings,
                    authentication__multifactor_state, created_date, updated_date
                ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, now(), now())
                RETURNING id
            `, [
                fixture.email,
                fixture.name,
                fixture.username,
                fixture.password === undefined ? null : this.auth.hashPassword(fixture.password),
                fixture.status,
                fixture.siteRole,
                this.fixtureSettings(),
                fixture.multifactor
            ])
            userId = inserted.rows[0].id

            if ( fixture.siteModeration !== null ) {
                const moderation = await client.query(`
                    INSERT INTO site_moderation (user_id, status, user_profile_id, created_date, updated_date)
                        VALUES ($1, $2, $3, now(), now())
                    RETURNING id
                `, [ fixture.siteModeration.flaggedBy, fixture.siteModeration.status, userId ])

                await client.query(`
                    UPDATE users SET site_moderation_id = $1 WHERE id = $2
                `, [ moderation.rows[0].id, userId ])
            }

            await client.query('COMMIT')
        } catch (error) {
            await client.query('ROLLBACK')

            // Another request took the email or username since the check.
            if ( error.code === '23505' ) {
                throw new ControllerError(409, 'conflict',
                    `Test fixture '${fixture.username}' conflicts with an existing user: ${error.message}`,
                    `A user with that email or username already exists.`)
            }
            throw error
        } finally {
            client.release()
        }

        this.logger.info(`Created test fixture User(${userId}) '${fixture.username}': ${fixture.status}, `
            + `site ${fixture.siteRole}, multi-factor ${fixture.multifactor}`
            + `${fixture.siteModeration ? `, profile ${fixture.siteModeration.status}` : ''}.`)

        const results = await this.userDAO.selectUsers({
            where: `users.id = $1`,
            params: [ userId ],
            fields: 'all'
        })

        response.status(201).json({
            entity: results.dictionary[userId]
        })
    }

    /**
     * DELETE /test/user/:id
     *
     * Delete a test fixture user, and log out any sessions they have.
     * Refuses a user whose email doesn't match FIXTURE_EMAIL, so it can't
     * delete a real account.
     */
    async deleteUser(request, response) {
        this.checkPlatform(request)

        const userId = request.params.id
        if ( ! UUID.test(userId) ) {
            throw new ControllerError(400, 'invalid',
                `DELETE /test/user/${userId}: not a user id.`,
                `That isn't a user id.`)
        }

        const results = await this.database.query(`
            SELECT email FROM users WHERE id = $1
        `, [ userId ])
        if ( results.rows.length === 0 ) {
            throw new ControllerError(404, 'not-found',
                `Attempt to delete test fixture User(${userId}), who doesn't exist.`,
                `There's no user with that id.`)
        }

        if ( ! FIXTURE_EMAIL.test(results.rows[0].email) ) {
            throw new ControllerError(403, 'not-authorized',
                `Attempt to delete User(${userId}) through the test fixtures, but they aren't one.`,
                `Only test fixtures can be deleted here.`)
        }

        await this.sessionService.deleteSessionsForUser(userId)
        await this.userDAO.deleteUser({ id: userId })

        this.logger.info(`Deleted test fixture User(${userId}).`)

        response.status(200).json(null)
    }
}
