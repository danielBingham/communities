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

const MigrationError = require('../errors/MigrationError')

module.exports = class CommentSubscriptionsMigration {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config
    }

    async initForward() {
        this.logger.info(`Create the 'post_subscriptions' table...`)
        await this.database.query(`
            CREATE TABLE IF NOT EXISTS post_subscriptions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,
                post_id uuid REFERENCES posts (id) ON DELETE CASCADE NOT NULL,

                created_date timestamptz,
                updated_date timestamptz
            )
        `, [])

        this.logger.info(`Create the index for 'user_id'...`)
        await this.database.query(`CREATE INDEX IF NOT EXISTS post_subscriptions__user_id ON post_subscriptions (user_id)`, [])

        this.logger.info(`Create the index for 'post_id'...`)
        await this.database.query(`CREATE INDEX IF NOT EXISTS post_subscriptions__post_id ON post_subscriptions (post_id)`, [])

    }

    async initBack() {
        this.logger.info(`Dropping the index for 'user_id'...`)
        await this.database.query(`DROP INDEX IF EXISTS post_subscriptions__user_id`, [])

        this.logger.info(`Dropping the index for 'post_id'...`)
        await this.database.query(`DROP INDEX IF EXISTS post_subscriptions__post_id`, [])

        this.logger.info(`Dropping the table...`)
        await this.database.query(`DROP TABLE IF EXISTS post_subscriptions`, [])
    }


    /**
     * Do any setup necessary to initialize this migration.
     *
     * This *should not impact data*.  Only steps that have no impact or no
     * risk to user data should happen here.
     *
     * These steps also need to be fully backwards compatible, and
     * non-destructively rolled back.
     *
     * So here we can create a new table, add a column with null values to a
     * table (to be populated later), create a new ENUM, etc.
     */
    async initialize() {
        try {
            await this.initForward()
        } catch (error) {
            try {
                this.logger.error(`Initialization failed.  Attempting rollback...`)
                await this.initBack()
            } catch (rollbackError) {
                this.logger.error(`Rollback failed.`)
                this.logger.error(rollbackError)
                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }
    }

    /**
     * Rollback the setup phase.
     */
    async uninitialize() {
        try {
            await this.initBack()
        } catch (error) {
            try {
                this.logger.error(`Uninitialization failed.  Attempting rollback...`)
                await this.initForward()
            } catch (rollbackError) {
                this.logger.error(`Rollback failed.`)
                this.logger.error(rollbackError)

                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }
    }

    async migrateForward() {

        const postMap = {}

        this.logger.info('Retrieving posts...')
        const postResults = await this.database.query(`
            SELECT id, user_id from posts
        `, [])

        if ( postResults.rows.length > 0 ) {
            for(const row of postResults.rows ) {
                if ( ! ( row.id in postMap ) ) {
                    postMap[row.id] = {}
                }

                postMap[row.id][row.user_id] = true
            }
        }

        this.logger.info('Retrieving post comments...')
        const commentResults = await this.database.query(`
            SELECT DISTINCT ON (post_id, user_id) post_id, user_id FROM post_comments
        `, [])

       
        if ( commentResults.rows.length > 0 ) {
            for(const row of commentResults.rows) {
                if ( ! (row.post_id in postMap )) {
                    postMap[row.post_id] = {}
                }
                postMap[row.post_id][row.user_id] = true
            }
        }

        if ( postResults.rows.length <= 0 && commentResults.rows.length <= 0 ) {
            this.logger.info('Nothing to subscribe...')
            return
        }

        this.logger.info('Building insert sql..')
        const params = []
        let sql = `
            INSERT INTO post_subscriptions (user_id, post_id, created_date, updated_date)
                VALUES
        `


        let count = 1
        for(const [postId, users] of Object.entries(postMap)) {
            for( const [ userId, value] of Object.entries(users)) {
                sql += `${count > 1 ? ', ' : ''} ($${params.length+1}, $${params.length+2}, now(), now())`

                params.push(userId)
                params.push(postId)
                count += 1
            }
        }

        this.logger.info('Inserting subscriptions...')
        await this.database.query(sql, params)

        this.logger.info('Updating user settings, adding "Post:comment:create:subscriber"...')
        await this.database.query(`UPDATE users SET settings = jsonb_insert(settings, '{ notifications, "Post:comment:create:subscriber" }', '{ "web": true, "email": true, "push": true }')`)
    }

    async migrateBack() {
        this.logger.info('Deleting subscriptions...')
        await this.database.query('DELETE FROM post_subscriptions', [])

        this.logger.info('Updating user settings, removing "Post:comment:create:subscriber"...')
        await this.database.query(`UPDATE users SET settings = settings #- '{ notifications, "Post:comment:create:subscriber" }'`)
    }

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(targets) { 
        try {
            await this.migrateForward()
        } catch (error) {
            try {
                this.logger.error(`Migration failed.  Attempting rollback...`)
                await this.migrateBack()
            } catch (rollbackError) {
                this.logger.error(`Rollback failed.`)
                this.logger.error(rollbackError)

                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }
    }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) {
        try {
            await this.migrateBack()
        } catch (error) {
            try {
                this.logger.error(`Migration rollback failed.  Attempting rollback...`)
                await this.migrateForward()
            } catch (rollbackError) {
                this.logger.error(`Rollback failed.`)
                this.logger.error(rollbackError)

                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }
    }
}
