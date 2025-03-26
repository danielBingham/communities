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

module.exports = class PublicPostsMigration {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config
    }

    async initForward() {
        this.logger.info(`Create the 'post_visibility' type...`)
        await this.database.query(`CREATE TYPE post_visibility as ENUM('public', 'private')`, [])

        this.logger.info(`Add the 'visibility' column to the 'posts' table...`)
        await this.database.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility post_visibility NOT NULL DEFAULT 'private'`, [])
    }

    async initBack() {
        this.logger.info(`Remove the 'visibility' column from the 'posts' table...`)
        await this.database.query(`ALTER TABLE posts DROP COLUMN IF EXISTS post_visibility`, [])

        this.logger.info(`Drop the 'post_visibility' type...`)
        await this.database.query(`DROP TYPE IF EXISTS post_visibility`)
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
        this.logger.info(`Update posts.visibility in Open groups to 'public' visibility.`)
        const groupResults = await this.database.query(`SELECT id FROM groups WHERE type = 'open'`, [])
        const openGroupIds = groupResults.rows.map((r) => r.id)

        await this.database.query(`UPDATE posts SET visibility = 'public' WHERE group_id = ANY($1::uuid[])`, [ openGroupIds])
    }

    async migrateBack() { 
        this.logger.info(`Reset posts.visibility to default of 'private'...`)
        await this.database.query(`UPDATE posts SET visibility = 'private'`, [])
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
