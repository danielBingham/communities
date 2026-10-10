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
 * Seeds the integration test fixture users.
 *
 *   npm run test:integration:seed            (NODE_ENV=development)
 *   npm run test:integration:seed:staging    (NODE_ENV=staging)
 *
 * Writes every user in fixtures/users.js straight to the database, so nobody
 * has to register them through the app and confirm them by email. An account
 * that already exists (matched by email) is put back the way fixtures/users.js
 * describes it, so it's safe to run before every test run.
 *
 * It uses the same configuration file the web application does,
 * server/config/index.<NODE_ENV>.js, but loads only its `database` values.
 * It refuses to run with the production configuration, and it only changes
 * the fixture accounts and the moderations of their profiles.
 ******************************************************************************/

const { AuthenticationService, Config, Core, NotificationWorker } = require('@communities/backend')

const fixtures = require('./fixtures/users')

// Email off for every notification, the way the app's email toggle leaves
// them (web, desktop and mobile stay on), and no 'info' or 'announcement'
// posts in the feed.
const notifications = {}
for (const type of NotificationWorker.notifications) {
    notifications[type] = { web: true, email: false, desktop: true, mobile: true }
}
const SETTINGS = { notifications: notifications, showInfo: false, showAnnouncements: false }

// The app's own password hashing. It doesn't need a database.
const auth = new AuthenticationService({})

const loadDatabaseConfig = async function() {
    const definition = require('../../server/config')

    if ( definition.environment === 'production' ) {
        throw new Error(`The integration test fixtures can't be seeded with the production configuration.`)
    }

    const loader = new Config(process.env.COMMUNITIES_ENVIRONMENT_NAME, process.env.AWS_REGION, {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })
    return await loader.loadConfig({ environment: definition.environment, database: definition.database })
}

/**
 * Create the fixture's account, or update it to match the fixture.
 *
 * @return {string} The account's id.
 */
const seedUser = async function(database, fixture) {
    // Registration checks the birthdate but doesn't save it, hence NULL.
    const results = await database.query(`
        INSERT INTO users (
            email, name, username, password, birthdate, status, site_role, settings,
            authentication__multifactor_state, created_date, updated_date
        ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, now(), now())
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            username = EXCLUDED.username,
            password = EXCLUDED.password,
            birthdate = EXCLUDED.birthdate,
            status = EXCLUDED.status,
            site_role = EXCLUDED.site_role,
            settings = EXCLUDED.settings,
            authentication__multifactor_state = EXCLUDED.authentication__multifactor_state,
            updated_date = now()
        RETURNING id
    `, [
        fixture.email,
        fixture.name,
        fixture.username,
        fixture.password === undefined ? null : auth.hashPassword(fixture.password),
        fixture.status ?? 'confirmed',
        fixture.siteRole ?? 'user',
        SETTINGS,
        fixture.multifactor ?? 'disabled'
    ])
    const id = results.rows[0].id

    // Put back anything a test run can change. With multi-factor
    // authentication off the account has no secret; with it on, it keeps the
    // one it has, if any.
    await database.query(`
        UPDATE users SET
            file_id = DEFAULT,
            privacy__view_friends = DEFAULT,
            privacy__view_mutual_friends = DEFAULT,
            failed_authentication_attempts = DEFAULT,
            last_authentication_attempt_date = DEFAULT,
            authentication__multifactor_failed_attempts = DEFAULT,
            authentication__multifactor_last_attempt_date = DEFAULT,
            authentication__multifactor_secret = CASE
                WHEN authentication__multifactor_state = 'disabled' THEN NULL
                ELSE authentication__multifactor_secret
            END
        WHERE id = $1
    `, [ id ])

    return id
}

/**
 * Give each fixture's profile exactly the moderation the fixture describes:
 * remove the ones they have, then add any described.
 */
const seedProfileModerations = async function(database, ids) {
    await database.query(`
        DELETE FROM site_moderation WHERE user_profile_id = ANY($1::uuid[])
    `, [ Object.values(ids) ])

    for (const [key, fixture] of Object.entries(fixtures)) {
        if ( fixture.siteModeration === undefined ) {
            continue
        }

        const { status, flaggedBy } = fixture.siteModeration
        if ( ! (flaggedBy in ids) ) {
            throw new Error(`${key}: siteModeration.flaggedBy must name a fixture, but it's '${flaggedBy}'.`)
        }

        const results = await database.query(`
            INSERT INTO site_moderation (user_id, status, user_profile_id, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now())
            RETURNING id
        `, [ ids[flaggedBy], status, ids[key] ])

        await database.query(`
            UPDATE users SET site_moderation_id = $1 WHERE id = $2
        `, [ results.rows[0].id, ids[key] ])
    }
}

// One line per fixture: "user-flagged          confirmed, profile flagged by user1".
const summarize = function(key, fixture) {
    const facts = [ fixture.status ?? 'confirmed' ]
    if ( fixture.siteRole ) facts.push(`site ${fixture.siteRole}`)
    if ( fixture.multifactor ) facts.push(`multi-factor ${fixture.multifactor}`)
    if ( fixture.siteModeration ) facts.push(`profile ${fixture.siteModeration.status} by ${fixture.siteModeration.flaggedBy}`)
    return `  ${key.padEnd(22)}${facts.join(', ')}`
}

const seed = async function() {
    const config = await loadDatabaseConfig()
    const { host, port, name } = config.database

    const pool = Core.createDatabasePool(config.database)
    const database = await pool.connect().catch(function(error) {
        throw new Error(`Couldn't connect to the database at ${host}:${port}: ${error.message}`)
    })

    // All or nothing: a failure leaves the database as it was.
    try {
        console.log(`Seeding the integration test users into '${name}' at ${host}:${port}...`)
        await database.query('BEGIN')

        const ids = {}
        for (const [key, fixture] of Object.entries(fixtures)) {
            ids[key] = await seedUser(database, fixture).catch(function(error) {
                throw new Error(`${key}: ${error.message}`)
            })
            console.log(summarize(key, fixture))
        }
        await seedProfileModerations(database, ids)

        await database.query('COMMIT')
        console.log(`Done: ${Object.keys(ids).length} users are ready.`)
    } catch (error) {
        await database.query('ROLLBACK')
        throw error
    } finally {
        database.release()
        await pool.end()
    }
}

seed().catch(function(error) {
    console.error(error.message)
    process.exitCode = 1
})
