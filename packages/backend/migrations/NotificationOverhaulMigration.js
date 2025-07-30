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

module.exports = class LimitLoginAttemptsMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { }

    async initBack() { }

    async migrateForward(targets) {
        const settingsResults = await this.database.query(`
            SELECT id, settings from users
        `, [])

        for(const row of settingsResults.rows) {
            const id = row.id
            const settings = row.settings

            settings.notifications['PostComment:create:author'] = settings.notifications['Post:comment:create']
            settings.notifications['PostComment:create:subscriber'] = settings.notifications['Post:comment:create:subscriber']
            settings.notifications['PostComment:create:mention'] = settings.notifications['Post:comment:create:mention']

            settings.notifications['SiteModeration:update:post-rejected-author'] = settings.notifications['Post:moderation:rejected']
            settings.notifications['SiteModeration:update:comment-rejected-author'] = settings.notifications['Post:comment:moderation:rejected']

            await this.database.query(`
                UPDATE users SET settings = $1 WHERE id = $2
            `, [ settings, id])
        }
    }

    async migrateBack(targets) {}
}
