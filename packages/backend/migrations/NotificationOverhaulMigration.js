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

            settings.notifications['GroupMember:create:status:pending-invited:member'] = settings.notifications['Group:member:create:invited']
            settings.notifications['GroupMember:create:status:pending-requested:moderator'] = settings.notifications['Group:member:create:requested']
            settings.notifications['GroupMember:update:status:pending-requested-member:member'] = settings.notifications['Group:member:update:request:accepted']
            settings.notifications['GroupMember:update:role:moderator:member'] = settings.notifications['Group:member:update:promoted:moderator']
            settings.notifications['GroupMember:update:role:admin:member'] = settings.notifications['Group:member:update:promoted:admin']

            settings.notifications['GroupModeration:update:post:status:rejected:author'] = settings.notifications['Group:post:moderation:rejected']
            settings.notifications['GroupModeration:update:comment:status:rejected:author'] = settings.notifications['Group:post:comment:moderation:rejected']

            settings.notifications['Post:create:mention'] = settings.notifications['Post:mention']

            settings.notifications['PostComment:create:author'] = settings.notifications['Post:comment:create']
            settings.notifications['PostComment:create:subscriber'] = settings.notifications['Post:comment:create:subscriber']
            settings.notifications['PostComment:create:mention'] = settings.notifications['Post:comment:create:mention']

            settings.notifications['SiteModeration:update:post:status:rejected:author'] = settings.notifications['Post:moderation:rejected']
            settings.notifications['SiteModeration:update:comment:status:rejected:author'] = settings.notifications['Post:comment:moderation:rejected']

            settings.notifications['UserRelationship:create:relation'] = settings.notifications['User:friend:create']
            settings.notifications['UserRelationship:update:user'] = settings.notifications['User:friend:update']


            await this.database.query(`
                UPDATE users SET settings = $1 WHERE id = $2
            `, [ settings, id])
        }
    }

    async migrateBack(targets) {
        const settingsResults = await this.database.query(`
            SELECT id, settings from users
        `, [])

        for(const row of settingsResults.rows) {
            const id = row.id
            const settings = row.settings

            delete settings.notifications['GroupMember:create:status:pending-invited:member']
            delete settings.notifications['GroupMember:create:status:pending-requested:moderator']
            delete settings.notifications['GroupMember:update:status:pending-requested-member:member']
            delete settings.notifications['GroupMember:update:role:moderator:member']
            delete settings.notifications['GroupMember:update:role:admin:member']

            delete settings.notifications['GroupModeration:update:post:status:rejected:author']
            delete settings.notifications['GroupModeration:update:comment:status:rejected:author']

            delete settings.notifications['Post:create:mention']

            delete settings.notifications['PostComment:create:author']
            delete settings.notifications['PostComment:create:subscriber']
            delete settings.notifications['PostComment:create:mention']

            delete settings.notifications['SiteModeration:update:post:status:rejected:author']
            delete settings.notifications['SiteModeration:update:comment:status:rejected:author']

            delete settings.notifications['UserRelationship:create:relation']
            delete settings.notifications['UserRelationship:update:user']


            await this.database.query(`
                UPDATE users SET settings = $1 WHERE id = $2
            `, [ settings, id])
        }
    }
}
