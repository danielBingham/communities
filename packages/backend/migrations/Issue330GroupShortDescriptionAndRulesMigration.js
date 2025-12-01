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

module.exports = class Issue330GroupShortDescriptionAndRulesMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`
            ALTER TABLE groups ADD COLUMN IF NOT EXISTS short_description text
        `, [])

        await this.core.database.query(`
            ALTER TABLE groups ADD COLUMN IF NOT EXISTS rules text
        `, [])
    }

    async initBack() { 
        await this.core.database.query(`ALTER TABLE groups DROP COLUMN IF EXISTS short_description`, [])
        await this.core.database.query(`ALTER TABLE groups DROP COLUMN IF EXISTS rules`, [])
    }

    async migrateForward(targets) {
        const groupResults = await this.core.database.query(`
            SELECT id, about FROM groups
        `, [])

        if ( groupResults.rows.length > 0 ) {
            for(const row of groupResults.rows) {
                const id = row.id
                const shortDescription = row.about.substring(0, 150)
                await this.core.database.query(`
                    UPDATE groups SET short_description = $1 WHERE id = $2
                `, [ shortDescription, id ])
            }
        }
    }

    async migrateBack(targets) { }
}
