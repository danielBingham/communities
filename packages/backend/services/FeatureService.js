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

const FeatureDAO = require('../daos/FeatureDAO')

const ExampleMigration = require('../migrations/ExampleMigration')
const NotificationSettingsMigration = require('../migrations/NotificationSettingsMigration')
const NoticeMigration = require('../migrations/NoticeMigration')

const ServiceError = require('../errors/ServiceError')
const MigrationError = require('../errors/MigrationError')


/**
 *  A Service for managing feature flags and migrations.  By necessity feature
 *  flags break the fourth wall, as it were, because they need to be referenced
 *  directly in code forks anyway, and they'll be changed directly in code and
 *  commits.  So we store them both in the database (to make it easy to link
 *  them to other entities) and in the code itself (so that they can be defined
 *  when they are created and needed and added to the database later).
 */
module.exports = class FeatureService {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config 

        this.featureDAO = new FeatureDAO(core)

        /**
         * A list of flags by name.
         *
         * This list is manually configured, with the database being brought
         * into sync with it by an admin user after deployment.  Features will
         * be inserted into the database when the admin hits "insert" on the
         * dashboard.
         */
        this.features = {
            'example':  {
                dependsOn: [],
                conflictsWith: [],
                migration: new ExampleMigration(core)
            },
            '1-notification-settings': {
                dependsOn: [],
                conflictsWith: [],
                migration: new NotificationSettingsMigration(core)
            },
            '3-notices': {
                dependsOn: [],
                conflictsWith: [],
                migration: new NoticeMigration(core)
            }
        }
    }

    /**
     * Get feature flags for a user.  These are flags that the user has
     * permission to see and which can be shared with the frontend.
     *
     * NOTE: We're skipping the DAO here because we only need the name and the
     * status and none of the rest of the metadata.  We want to keep this
     * pretty efficient, since it's called on every request, so we're going
     * straight to the database and just getting exactly what we need.
     *
     * @param {User}    user    An instance of a populated `User` object.
     */
    async getEnabledFeatures() {
        const results = await this.database.query(`
            SELECT name, status FROM features WHERE status = $1
        `, [ 'enabled' ])

        const features = {}
        for (const row of results.rows) {
            features[row.name] = {
                name: row.name,
                status: row.status
            }
        }

        return features
    }

    /**
     * Get a single feature with its current status. Used in contexts where we
     * need the feature's full metadata.
     *
     * @param {string} name The name of the feature we want to get.
     */
    async getFeature(name) {
        const { dictionary } = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        let feature = dictionary[name]

        if ( ! feature && this.features[name] ) {
            feature = {
                name: name,
                status: 'uncreated'
            }
        } 

        feature.conflictsWith = this.features[name].conflictsWith
        feature.dependsOn = this.features[name].dependsOn

        return feature 
    }

    async updateFeatureStatus(name, status) {
        await this.featureDAO.updatePartialFeature({ name: name, status: status })
    }

    async insert(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.featureDAO.insertFeature({ name: name })
    }

    async initialize(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'initializing')

        try {
            await this.features[name].migration.initialize()
        } catch (error) {
            // If we get a migration error and the status is 'rolled-back',
            // that means the migration was safely able to catch its own error
            // and rollback.  The database is in a known state.
            //
            // We want to throw the error to log the bug and we'll need to fix
            // the bug and redeploy, but we don't need to do database surgery.
            //
            // If the error isn't a MigrationError, or the status isn't
            // 'rolled-back', then the database is in an unknown state.  Leave
            // it the feature in 'initializing', we're going to need to do
            // surgery and we can update the status of the feature as part of
            // that effort.
            //
            // Hopefully the latter never happens.
            if ( error instanceof MigrationError && error.status == 'rolled-back' ) {
                await this.updateFeatureStatus(name, 'created')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'initialized')
    }

    async migrate(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'migrating')

        try {
            await this.features[name].migration.up()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, 'initialized')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'migrated')
    }

    async enable(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'enabled')
    }

    async disable(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'disabled')
    }

    async rollback(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'rolling-back')

        try {
            await this.features[name].migration.down()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, 'disabled')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'rolled-back')
    }

    async uninitialize(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'uninitializing')

        try {
            await this.features[name].migration.uninitialize()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, 'initialized')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'uninitialized')
    }


}
