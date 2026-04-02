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

const { PermissionService }  = require('@communities/backend')

const ControllerError = require('../../errors/ControllerError')

module.exports = class StatsController {

    constructor(core) {
        this.core = core

        this.permissionService = new PermissionService(core)
    }

    async getStats(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempting to access admin stats.`,
                `You may not access that page while unauthenticated.`)
        }

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( ! canAdminSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.username}) attempting to access admin pages without authorization.`,
                `You're not authorized to administrate the site.`)
        }
        
        const stats =  {
            usersPerMonth: [],
            dau: null,
            mau: null,
            postsPerMonth: [],
            moderationsPerMonth: [] 
        }

        const [ userGrowthResults, postsPerMonthResults, moderationsPerMonthResults ] = await Promise.all([
            this.core.database.query(`SELECT count(*) as stat, date_trunc('month', created_date) as month FROM users GROUP BY month ORDER BY month DESC LIMIT 24`, []),
            this.core.database.query(`SELECT count(*) as stat, date_trunc('month', created_date) as month FROM posts GROUP BY month ORDER BY month DESC LIMIT 24`, []),
            this.core.database.query(`SELECT count(*) as stat, date_trunc('month', created_date) as month FROM site_moderation GROUP BY month ORDER BY month DESC LIMIT 24`, [])
        ])

        if ( userGrowthResults.rows.length > 0 ) {
            for(const row of userGrowthResults.rows) {
                stats.usersPerMonth.push({
                    stat: row.stat,
                    month: row.month
                })
            }
        }

        if ( postsPerMonthResults.rows.length > 0 ) {
            for(const row of postsPerMonthResults.rows) {
                stats.postsPerMonth.push({
                    stat: row.stat,
                    month: row.month
                })
            }
        }

        if ( moderationsPerMonthResults.rows.length > 0 ) {
            for(const row of moderationsPerMonthResults.rows) {
                stats.moderationsPerMonth.push({
                    stat: row.stat,
                    month: row.month
                })
            }
        }

        response.status(200).json(stats)
    }

}
