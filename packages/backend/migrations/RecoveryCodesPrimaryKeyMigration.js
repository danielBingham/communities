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
const BaseMigration = require('./BaseMigration')

/**
 * Gives `user_recovery_codes` a primary key, `id uuid`, like every other
 * table.
 *
 * It's the only table without one, and logical replication, which the
 * blue/green deployment that encrypts the database uses, can't replicate
 * UPDATE or DELETE on a table without one. Worse, once the table is in a
 * publication, PostgreSQL refuses those statements on the source database:
 * "cannot delete from table "user_recovery_codes" because it does not have a
 * replica identity and publishes deletes". Using a recovery code deletes it,
 * so without this, nobody could sign in with a recovery code while the
 * blue/green deployment exists.
 *
 * One statement adds the column, gives every existing row a random id, makes
 * it NOT NULL and adds the primary key. It rewrites the table under an
 * exclusive lock, which is brief: the table holds at most ten rows per user
 * with multifactor authentication on. Nothing else changes; every query
 * names its columns, so the new one doesn't affect them.
 *
 * Entirely in the initialization phase; there's no data to migrate.
 *
 * Don't roll it back (initBack drops the column) while a blue/green deployment
 * exists: that's a DDL change, which breaks its replication, and it would
 * bring the problem above back.
 */
module.exports = class RecoveryCodesPrimaryKeyMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`
            ALTER TABLE user_recovery_codes ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid()
        `, [])
    }

    async initBack() {
        // Dropping the column drops its primary key with it.
        await this.core.database.query(`ALTER TABLE user_recovery_codes DROP COLUMN IF EXISTS id`, [])
    }

    async migrateForward(targets) { }

    async migrateBack(targets) { }
}
