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

module.exports = class RelationshipsOwnStateMigration {

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

        this.logger.info('Retrieving post comments...')
        const results = await this.database.query(`
            SELECT DISTINCT post_id, user_id FROM post_comments
        `, [])

        if ( results.rows.length <= 0 ) {
            this.logger.info('No comments to subscribe.')
            return
        }

        this.logger.info('Building insert sql..')
        const params = []
        let sql = `
            INSERT INTO post_subscriptions (user_id, post_id, created_date, updated_date)
                VALUES
        `

        let count = 1
        for(const row of results.rows) {
            sql += `($${params.length+1}, $${params.length+2}, now(), now()) ${count == results.rows.length ? '' : ', '}`

            params.push(row.user_id)
            params.push(row.post_id)
            count += 1
        }

        this.logger.info('Inserting subscrpitions...')
        await this.database.query(sql, params)
    }

    async migrateBack() {
        this.logger.info('Deleting subscriptions...')
        await this.database.query('DELETE FROM post_subscriptions', [])
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
