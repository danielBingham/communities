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

module.exports = class Issue252GroupSubscriptionMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`
            CREATE TYPE group_subscription_status AS ENUM('unsubscribed', 'mentions', 'posts')
        `, [])

        await this.core.database.query(`
            CREATE TABLE IF NOT EXISTS group_subscriptions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,
                group_id uuid REFERENCES groups (id) ON DELETE CASCADE NOT NULL,
                status group_subscription_status DEFAULT 'mentions',

                created_date timestamptz,
                updated_date timestamptz
            )
        `, [])
        
        await this.core.database.query(`
            CREATE INDEX IF NOT EXISTS group_subscriptions__user_id ON group_subscriptions (user_id);
        `, [])

        await this.core.database.query(`
            CREATE INDEX IF NOT EXISTS group_subscriptions__group_id ON group_subscriptions (group_id);
        `, [])
    }

    async initBack() { 
        await this.core.database.query(`DROP INDEX IF EXISTS group_subscriptions__group_id`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS group_subscriptions__user_id`, [])
        await this.core.database.query(`DROP TABLE IF EXISTS group_subscriptions`, [])
        await this.core.database.query(`DROP TYPE IF EXISTS group_subscription_status`, [])
    }

    async migrateForward(targets) {
        const groupMemberResults = await this.core.database.query(`
            SELECT user_id, group_id FROM group_members WHERE status = 'member'
        `, [])

        for(const row of groupMemberResults.rows) {
            await this.core.database.query(`
                INSERT INTO group_subscriptions (user_id, group_id, status) VALUES ($1, $2, $3)
            `, [ row.user_id, row.group_id, 'mentions' ])
        }
    }

    async migrateBack(targets) { }
}
