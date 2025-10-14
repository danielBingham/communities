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

module.exports = class PrivateGroupsMigration {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config
    }

    async initForward() {
        this.logger.info(`Create the 'group_type' enum...`)
        await this.database.query(`CREATE TYPE group_type as ENUM('open', 'private', 'hidden')`, [])

        this.logger.info(`Create the 'groups' table...`)
        await this.database.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id uuid primary key DEFAULT gen_random_uuid(),
                type group_type DEFAULT 'hidden',
                title text,
                slug text,
                about text,

                file_id uuid REFERENCES files (id) ON DELETE SET NULL DEFAULT NULL,

                entrance_questions jsonb DEFAULT '{}'::jsonb,

                created_date timestamptz,
                updated_date timestamptz
            )
        `, [])

        this.logger.info(`Create the index for the 'file_id' column...`)
        await this.database.query(`CREATE INDEX IF NOT EXISTS groups__file_id ON groups (file_id)`, [])

        this.logger.info(`Create the 'group_member_status' type...`)
        await this.database.query(`CREATE TYPE group_member_status AS ENUM('pending-invited', 'pending-requested', 'member')`, [])

        this.logger.info(`Create the 'group_member_role' type...`)
        await this.database.query(`CREATE TYPE group_member_role AS ENUM('admin', 'moderator', 'member')`, [])

        this.logger.info(`Create the 'group_members' table...`)
        await this.database.query(`
            CREATE TABLE IF NOT EXISTS group_members (
                id uuid primary key DEFAULT gen_random_uuid(),
                group_id uuid REFERENCES groups (id) ON DELETE CASCADE NOT NULL,
                user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,

                status group_member_status DEFAULT 'pending-requested',
                entrance_answers jsonb DEFAULT '{}'::jsonb,
                role group_member_role,

                created_date timestamptz,
                updated_date timestamptz
            )
        `, [])

        this.logger.info(`Create the index for the 'group_id' field...`)
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_members__group_id ON group_members (group_id)`, [])

        this.logger.info(`Create the index for the 'user_id' field...`)
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_members__user_id ON group_members (user_id)`, [])

        this.logger.info(`Create the 'post_type' enum...`)
        await this.database.query(`CREATE TYPE post_type as ENUM('feed', 'group', 'event')`, [])

        this.logger.info(`Add 'type' field to 'posts' table...`)
        await this.database.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS type post_type NOT NULL DEFAULT 'feed'`, [])

        this.logger.info(`Add 'group_id' field to 'posts' table...`)
        await this.database.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups (id) ON DELETE CASCADE DEFAULT NULL`, [])

        /***  Not really part of groups, fixing a bug in the post_versions table that prevents users from being deleted. ***/
        this.logger.info(`Fixing the constraint on 'post_versions.file_id'...`)
        await this.database.query(`ALTER TABLE post_versions DROP CONSTRAINT post_versions_file_id_fkey`, [])
        await this.database.query(`ALTER TABLE post_versions ADD CONSTRAINT post_versions_file_id_fkey FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE SET NULL`, [])
    }

    async initBack() {
        /***  Not really part of groups, fixing a bug in the post_versions table that prevents users from being deleted. ***/
        this.logger.info(`Undo the constraint fix on 'post_versions.file_id'...`)
        await this.database.query(`ALTER TABLE post_versions DROP CONSTRAINT post_versions_file_id_fkey`, [])
        await this.database.query(`ALTER TABLE post_versions ADD CONSTRAINT post_versions_file_id_fkey FOREIGN KEY (file_id) REFERENCES files (id)`, [])

        this.logger.info(`Removing 'group_id' column from 'posts' table...`)
        await this.database.query(`ALTER TABLE posts DROP COLUMN IF EXISTS group_id`, [])

        this.logger.info(`Removing 'type' column from 'posts' table...`)
        await this.database.query(`ALTER TABLE posts DROP COLUMN IF EXISTS type`, [])

        this.logger.info(`Dropping 'post_type' enum...`)
        await this.database.query(`DROP TYPE IF EXISTS post_type`, [])

        this.logger.info(`Dropping the 'group_members__user_id' index...`)
        await this.database.query(`DROP INDEX IF EXISTS group_members__user_id`, [])

        this.logger.info(`Dropping the 'group_members_group_id' index...`)
        await this.database.query(`DROP INDEX IF EXISTS group_members__group_id`, [])

        this.logger.info(`Dropping the 'group_members' table...`)
        await this.database.query(`DROP TABLE IF EXISTS group_members`, [])

        this.logger.info(`Dropping the 'group_member_role' type...`)
        await this.database.query(`DROP TYPE IF EXISTS group_member_role`, [])

        this.logger.info(`Dropping the 'group_member_status' type...`)
        await this.database.query(`DROP TYPE IF EXISTS group_member_status`, [])

        this.logger.info(`Dropping index 'groups__file_id'...`)
        await this.database.query(`DROP INDEX IF EXISTS groups__file_id`, [])

        this.logger.info(`Dropping the 'groups' table...`)
        await this.database.query(`DROP TABLE IF EXISTS groups`, [])

        this.logger.info(`Dropping the 'group_type' enum...`)
        await this.database.query(`DROP TYPE IF EXISTS group_type`, [])
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

    async migrateForward() { }

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
