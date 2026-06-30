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
const crypto = require('node:crypto')

const BaseMigration = require('./BaseMigration')

module.exports = class Feat61MultifactorAuthenticationMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { 
        await this.core.database.query(`
            CREATE TYPE user_multifactor_state AS ENUM('disabled', 'pending', 'enabled')
        `, [])

        await this.core.database.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS authentication__multifactor_state user_multifactor_state NOT NULL DEFAULT 'disabled'
        `, [])

        await this.core.database.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS authentication__multifactor_secret text DEFAULT NULL
        `, [])

        await this.core.database.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS authentication__multifactor_failed_attempts int DEFAULT 0
        `, [])

        await this.core.database.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS authentication__multifactor_last_attempt_date timestamptz
        `, [])

        await this.core.database.query(`
            CREATE TABLE IF NOT EXISTS user_recovery_codes (
                code text,
                user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL
            )
        `, [])

        await this.core.database.query(`CREATE INDEX IF NOT EXISTS user_recovery_codes__code ON user_recovery_codes (code)`, [])
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS user_recovery_codes__user_id ON user_recovery_codes (user_id)`, [])

        await this.core.database.query(`
            CREATE TABLE tokens_hash_migration (
                id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                token text
            )
        `, [])
    }

    async initBack() { 
        await this.core.database.query(`DROP INDEX IF EXISTS user_recovery_codes__code`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS user_recovery_codes__user_id`, [])
        await this.core.database.query(`DROP TABLE IF EXISTS user_recovery_codes`, [])

        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS authentication__multifactor_state`, [])
        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS authentication__multifactor_secret`, [])
        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS authentication__multifactor_failed_attempts`, [])
        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS authentication__multifactor_last_attempt_date`, [])

        await this.core.database.query(`DROP TYPE IF EXISTS user_multifactor_state`, [])

        await this.core.database.query(`DROP TABLE IF EXISTS tokens_hash_migration`, [])
    }

    async migrateForward(targets) { 
        await this.core.database.query(`
            INSERT INTO tokens_hash_migration (id, token) 
                SELECT id, token FROM tokens
            ON CONFLICT DO NOTHING 
        `, [])

        const results = await this.core.database.query(`SELECT id, token FROM tokens`, [])
        
        if ( results.rows.length <= 0 ) {
            return
        }

        for(const row of results.rows) {
            const tokenHash = crypto.hash('sha256', row.token)
            await this.core.database.query(`
                UPDATE tokens SET token = $1 WHERE id = $2
            `, [ tokenHash, row.id ])
        }
    }

    async migrateBack(targets) { 
        await this.core.database.query(`
            UPDATE tokens 
                SET token = backup.token 
            FROM (
                SELECT id, token FROM tokens_hash_migration
            ) as backup
            WHERE tokens.id = backup.id
        `, [])
    }
}
