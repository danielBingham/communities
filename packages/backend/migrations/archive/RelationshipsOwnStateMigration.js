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
            this.logger.info(`Dropping old primary key...`)
            await this.database.query(`ALTER TABLE user_relationships DROP CONSTRAINT IF EXISTS user_relationships_pkey`, [])

            this.logger.info(`Adding new primary key 'id'...`)
            await this.database.query(`ALTER TABLE user_relationships ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid()`, [])

            this.logger.info(`Adding new primary key constraint for 'id'...`)
            await this.database.query(`ALTER TABLE user_relationships ADD CONSTRAINT user_relationships_pkey PRIMARY KEY(id)`, [])

            this.logger.info(`Creating new index for 'user_id'...`)
            await this.database.query(`CREATE INDEX IF NOT EXISTS user_relationships__user_id ON user_relationships (user_id)`, [])

            this.logger.info(`Creating new index for 'friend_id'...`)
            await this.database.query(`CREATE INDEX IF NOT EXISTS user_relationships__friend_id ON user_relationships (friend_id)`, [])
        } catch (error) {
            try {
                this.logger.error(`Migration failed.  Attempting rollback...`)
                this.logger.error(error)

                this.logger.info(`Dropping index for 'user_id'...`)
                await this.database.query(`DROP INDEX IF EXISTS user_relationships__user_id`, [])

                this.logger.info(`Dropping index for 'friend_id'...`)
                await this.database.query(`DROP INDEX IF EXISTS user_relationships__friend_id`, [])

                this.logger.info(`Dropping primary key constraint...`)
                await this.database.query(`ALTER TABLE user_relationships DROP CONSTRAINT IF EXISTS user_relationships_pkey`, [])

                this.logger.info(`Dropping column 'id'...`)
                await this.database.query(`ALTER TABLE user_relationships DROP COLUMN IF EXISTS id`, [])

                this.logger.info(`Adding primary key constraint for 'user_id' and 'friend_id'...`)
                await this.database.query(`ALTER TABLE user_relationships ADD CONSTRAINT user_relationships_pkey PRIMARY KEY(user_id, friend_id)`, [])
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
            this.logger.info(`Dropping index for 'user_id'...`)
            await this.database.query(`DROP INDEX IF EXISTS user_relationships__user_id`, [])

            this.logger.info(`Dropping index for 'friend_id'...`)
            await this.database.query(`DROP INDEX IF EXISTS user_relationships__friend_id`, [])

            this.logger.info(`Dropping primary key constraint...`)
            await this.database.query(`ALTER TABLE user_relationships DROP CONSTRAINT IF EXISTS user_relationships_pkey`, [])

            this.logger.info(`Dropping column 'id'...`)
            await this.database.query(`ALTER TABLE user_relationships DROP COLUMN IF EXISTS id`, [])

            this.logger.info(`Adding primary key constraint for 'user_id' and 'friend_id'...`)
            await this.database.query(`ALTER TABLE user_relationships ADD CONSTRAINT user_relationships_pkey PRIMARY KEY(user_id, friend_id)`, [])
        } catch (error) {
            try {
                this.logger.error(`Migration failed.  Attempting rollback...`)
                this.logger.error(error)

                this.logger.info(`Dropping primary key constraint...`)
                await this.database.query(`ALTER TABLE user_relationships DROP CONSTRAINT IF EXISTS user_relationships_pkey`, [])

                this.logger.info(`Adding column 'id'...`)
                await this.database.query(`ALTER TABLE user_relationships ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid()`, [])

                this.logger.info(`Adding primary key constraint for 'id'...`)
                await this.database.query(`ALTER TABLE user_relationships ADD CONSTRAINT user_relationships_pkey PRIMARY KEY(id)`, [])

                this.logger.info(`Creating index for 'user_id'...`)
                await this.database.query(`CREATE INDEX IF NOT EXISTS user_relationships__user_id ON user_relationships (user_id)`, [])

                this.logger.info(`Creating index for 'friend_id'...`)
                await this.database.query(`CREATE INDEX IF NOT EXISTS user_relationships__friend_id ON user_relationships (friend_id)`, [])
            } catch (rollbackError) {
                this.logger.error(`Rollback failed.`)
                this.logger.error(rollbackError)

                throw new MigrationError('no-rollback', rollbackError.message)
            }
            throw new MigrationError('rolled-back', error.message)
        }
    }

    /**
     * Execute the migration for a set of targets.  Or for everyone if no
     * targets are given.
     *
     * Migrations always need to be non-destructive and rollbackable.  
     */
    async up(targets) { }

    /**
     * Rollback the migration.  Again, needs to be non-destructive.
     */
    async down(targets) { }
}
