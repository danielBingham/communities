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

const DAO  = require('./DAO')

const DAOError = require('../errors/DAOError')

const PAGE_SIZE = 20
const SCHEMA = {
    'Notification': {
        table: 'notifications',
        fields: {
            'id': {
                insert: DAO.INSERT.PRIMARY,
                update: DAO.UPDATE.PRIMARY,
                select: DAO.SELECT.ALWAYS,
                key: 'id'
            },
            'user_id': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'userId'
            },
            'type': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'type'
            },
            'description': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'description'
            },
            'path': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'path',
            },
            'is_read': {
                insert: DAO.INSERT.ALLOW,
                insertDefault: () => false,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'isRead'
            },
            'created_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'createdDate'
            },
            'updated_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.UPDATE.OVERRIDE,
                updateOverride: 'now()',
                select: DAO.SELECT.ALWAYS,
                key: 'updatedDate'
            }

        }
    }
}

module.exports = class NotificationsDAO extends DAO {

    constructor(core) {
        super(core)

        this.entityMaps = SCHEMA
    }

    getNotificationSelectionString() {
        return this.getSelectionString('Notification')
    }

    hydrateNotification(row) {
        return this.hydrate('Notification', row)
    }

    hydrateNotifications(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows ) {
            if ( ! ( row.Notification_id in dictionary) ) {
                dictionary[row.Notification_id] = this.hydrateNotification(row)
                list.push(row.Notification_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getNotificationById(id) {
        const results = await this.selectNotifications({
            where: `notifications.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        if ( ! ( id in results.dictionary ) ) {
            return null
        }

        return results.dictionary[id]
    }

    async selectNotifications(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let order = query.order ? `${query.order}` : `notifications.created_date DESC`

        let paging = ''
        if ( 'page' in query && Number.isNaN(parseInt(query.page, 10)) !== true) {
            const page = parseInt(query.page, 10)
            const pageSize = query.pageSize ? query.pageSize : PAGE_SIZE

            const offset = (page-1) * pageSize
            let count = params.length

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(pageSize)
            params.push(offset)
        }

        const sql = `
            SELECT
                ${this.getNotificationSelectionString()}
            FROM notifications
            ${where}
            ORDER BY ${order}
            ${paging}
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        }


        return this.hydrateNotifications(results.rows)
    }

    async getNotificationPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page && Number.isNaN(parseInt(query.page, 10)) !== true ? parseInt(query.page, 10) : 1

        const results = await this.core.database.query(`
                SELECT
                    COUNT(*)
                FROM notifications
                ${where}
        `, params)

        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        return {
            count: count,
            page: page,
            pageSize: PAGE_SIZE,
            numberOfPages: Math.floor(count / PAGE_SIZE) + ( (count % PAGE_SIZE) > 0 ? 1 : 0)
        }
    }

    async insertNotifications(notifications) {
        await this.insert('Notification', notifications)
    }

    async updateNotification(notification) {
        await this.update('Notification', notification)
    }

    async deleteNotification(notification) {
        await this.core.database.query(`
            DELETE FROM notifications WHERE id = $1
        `, [ notification.id ] )
    }
}
