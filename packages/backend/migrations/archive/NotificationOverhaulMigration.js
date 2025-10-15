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

            if ( 'Group:member:create:invited' in settings.notifications ) {
                settings.notifications['GroupMember:create:status:pending-invited:member'] = {
                    web: settings.notifications['Group:member:create:invited'].web,
                    email: settings.notifications['Group:member:create:invited'].email,
                    desktop: settings.notifications['Group:member:create:invited'].push,
                    mobile: settings.notifications['Group:member:create:invited'].push
                }
            }

            if ( 'Group:member:create:requested' in settings.notifications ) {
                settings.notifications['GroupMember:create:status:pending-requested:moderator'] = {
                    web: settings.notifications['Group:member:create:requested'].web,
                    email: settings.notifications['Group:member:create:requested'].email,
                    desktop: settings.notifications['Group:member:create:requested'].push,
                    mobile: settings.notifications['Group:member:create:requested'].push
                }
            }

            if ( 'Group:member:update:request:accepted' in settings.notifications ) {
                settings.notifications['GroupMember:update:status:pending-requested-member:member'] = {
                    web: settings.notifications['Group:member:update:request:accepted'].web,
                    email: settings.notifications['Group:member:update:request:accepted'].email,
                    desktop: settings.notifications['Group:member:update:request:accepted'].push,
                    mobile: settings.notifications['Group:member:update:request:accepted'].push
                }
            }
            
            if ( 'Group:member:update:promoted:moderator' in settings.notifications ) {
                settings.notifications['GroupMember:update:role:moderator:member'] = {
                    web: settings.notifications['Group:member:update:promoted:moderator'].web,
                    email: settings.notifications['Group:member:update:promoted:moderator'].email,
                    desktop: settings.notifications['Group:member:update:promoted:moderator'].push,
                    mobile: settings.notifications['Group:member:update:promoted:moderator'].push
                }
            }
            
            if ( 'Group:member:update:promoted:admin' in settings.notifications ) {
                settings.notifications['GroupMember:update:role:admin:member'] = {
                    web: settings.notifications['Group:member:update:promoted:admin'].web,
                    email: settings.notifications['Group:member:update:promoted:admin'].email,
                    desktop: settings.notifications['Group:member:update:promoted:admin'].push,
                    mobile: settings.notifications['Group:member:update:promoted:admin'].push
                }
            }

            if ( 'Group:post:moderation:rejected' in settings.notifications ) {
                settings.notifications['GroupModeration:update:post:status:rejected:author'] = {
                    web: settings.notifications['Group:post:moderation:rejected'].web,
                    email: settings.notifications['Group:post:moderation:rejected'].email,
                    desktop: settings.notifications['Group:post:moderation:rejected'].push,
                    mobile: settings.notifications['Group:post:moderation:rejected'].push
                }
            }
            
            if ( 'Group:post:comment:moderation:rejected' in settings.notifications ) {
                settings.notifications['GroupModeration:update:comment:status:rejected:author'] = {
                    web: settings.notifications['Group:post:comment:moderation:rejected'].web,
                    email: settings.notifications['Group:post:comment:moderation:rejected'].email,
                    desktop: settings.notifications['Group:post:comment:moderation:rejected'].push,
                    mobile: settings.notifications['Group:post:comment:moderation:rejected'].push
                }
            }

            if ( 'Post:mention' in settings.notifications ) {
                settings.notifications['Post:create:mention'] = {
                    web: settings.notifications['Post:mention'].web,
                    email: settings.notifications['Post:mention'].email,
                    desktop: settings.notifications['Post:mention'].push,
                    mobile: settings.notifications['Post:mention'].push
                }
            }

            if ( 'Post:comment:create' in settings.notifications ) {
                settings.notifications['PostComment:create:author'] = {
                    web: settings.notifications['Post:comment:create'].web,
                    email: settings.notifications['Post:comment:create'].email,
                    desktop: settings.notifications['Post:comment:create'].push,
                    mobile: settings.notifications['Post:comment:create'].push
                }
            }
            
            if ( 'Post:comment:create:subscriber' in settings.notifications ) {
                settings.notifications['PostComment:create:subscriber'] = {
                    web: settings.notifications['Post:comment:create:subscriber'].web,
                    email: settings.notifications['Post:comment:create:subscriber'].email,
                    desktop: settings.notifications['Post:comment:create:subscriber'].push,
                    mobile: settings.notifications['Post:comment:create:subscriber'].push
                }
            }
            
            if ( 'Post:comment:create:mention' in settings.notifications ) {
                settings.notifications['PostComment:create:mention'] = {
                    web: settings.notifications['Post:comment:create:mention'].web,
                    email: settings.notifications['Post:comment:create:mention'].email,
                    desktop: settings.notifications['Post:comment:create:mention'].push,
                    mobile: settings.notifications['Post:comment:create:mention'].push
                }
            }

            if ( 'Post:moderation:rejected' in settings.notifications ) {
                settings.notifications['SiteModeration:update:post:status:rejected:author'] = {
                    web: settings.notifications['Post:moderation:rejected'].web,
                    email: settings.notifications['Post:moderation:rejected'].email,
                    desktop: settings.notifications['Post:moderation:rejected'].push,
                    mobile: settings.notifications['Post:moderation:rejected'].push
                }
            }
            
            if ( 'Post:comment:moderation:rejected' in settings.notifications ) {
                settings.notifications['SiteModeration:update:comment:status:rejected:author'] = {
                    web: settings.notifications['Post:comment:moderation:rejected'].web,
                    email: settings.notifications['Post:comment:moderation:rejected'].email,
                    desktop: settings.notifications['Post:comment:moderation:rejected'].push,
                    mobile: settings.notifications['Post:comment:moderation:rejected'].push
                }
            }

            if ( 'User:friend:create' in settings.notifications ) {
                settings.notifications['UserRelationship:create:relation'] = {
                    web: settings.notifications['User:friend:create'].web,
                    email: settings.notifications['User:friend:create'].email,
                    desktop: settings.notifications['User:friend:create'].push,
                    mobile: settings.notifications['User:friend:create'].push
                }
            }
            
            if ( 'User:friend:update' in settings.notifications ) {
                settings.notifications['UserRelationship:update:user'] = {
                    web: settings.notifications['User:friend:update'].web,
                    email: settings.notifications['User:friend:update'].email,
                    desktop: settings.notifications['User:friend:update'].push,
                    mobile: settings.notifications['User:friend:update'].push
                }
            }

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
