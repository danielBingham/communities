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

module.exports = class AdminModerationMigration {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config
    }

    async initForward() { 
        await this.database.query(`CREATE TYPE user_site_role AS ENUM('user', 'moderator', 'admin', 'superadmin')`, [])
        await this.database.query(`ALTER TABLE users ADD COLUMN site_role user_site_role DEFAULT 'user'`, [])
      
        await this.database.query(`CREATE TYPE site_moderation_status AS ENUM('flagged', 'approved', 'rejected')`, [])
        await this.database.query(`
             CREATE TABLE IF NOT EXISTS site_moderation (
                id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                user_id uuid REFERENCES users (id) ON DELETE SET NULL,

                status site_moderation_status NOT NULL DEFAULT 'flagged',
                reason text,

                post_id uuid REFERENCES posts (id) ON DELETE CASCADE DEFAULT NULL,
                post_comment_id uuid REFERENCES post_comments (id) ON DELETE CASCADE DEFAULT NULL,

                created_date timestamptz, 
                updated_date timestamptz
            )`, [])
        
        await this.database.query(`CREATE INDEX IF NOT EXISTS site_moderation__user_id ON site_moderation (user_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS site_moderation__post_id ON site_moderation (post_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS site_moderation__post_comment_id ON site_moderation (post_comment_id)`, [])

        await this.database.query(`
            CREATE TABLE IF NOT EXISTS site_moderation_events (
                id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                site_moderation_id uuid REFERENCES site_moderation (id) ON DELETE SET NULL,
                user_id uuid REFERENCES users (id) ON DELETE SET NULL,

                status site_moderation_status NOT NULL,
                reason text,

                post_id uuid REFERENCES posts(id) ON DELETE CASCADE DEFAULT NULL,
                post_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE DEFAULT NULL,

                created_date timestamptz
            )`, [])

        await this.database.query(`CREATE INDEX IF NOT EXISTS site_moderation_events__site_moderation_id ON site_moderation_events (site_moderation_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS site_moderation_events__user_id ON site_moderation_events (user_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS site_moderation_events__post_id ON site_moderation_events (post_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS site_moderation_events__post_comment_id ON site_moderation_events (post_comment_id)`, [])

    }

    async initBack() { 
        await this.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS site_role`, [])
        await this.database.query(`DROP TYPE user_site_role`, [])

        await this.database.query(`DROP INDEX IF EXISTS site_moderation__post_comment_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS site_moderation__post_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS site_moeration__user_id`, [])
        await this.database.query(`DROP TABLE IF EXISTS site_moderation`, [])

        await this.database.query(`DROP INDEX IF EXISTS site_moderation_events__site_moderation_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS site_moderation_events__user_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS site_moderation_events__post_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS site_moderation_events__post_comment_id`, [])
        await this.database.query(`DROP TABLE IF EXISTS site_moderation_events`, [])

        await this.database.query(`DROP TYPE IF EXISTS site_moderation_status`, [])
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
                this.logger.error(error)
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
                this.logger.error(error)
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
        await this.database.query(`UPDATE users SET site_role = cast(cast(permissions as text) as user_site_role)`, [])
    }

    async migrateBack() { }

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
                this.logger.error(error)
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
