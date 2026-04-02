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
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import logger from '/logger'

import { getStats } from '/state/admin'

import { useRequest } from '/lib/hooks/useRequest'

import Card from '/components/ui/Card'
import Spinner from '/components/Spinner'

import './AdminDashboard.css'

const AdminDashboard = function() {
    try {
        const stats = useSelector((state) => state.admin.stats)
        const [ request, makeRequest ] = useRequest()

        useEffect(() => {
            makeRequest(getStats())
        }, [])

        if ( request?.state !== 'fulfilled') {
            return (
                <div className="admin-dashboard">
                    <Spinner />
                </div>
            )
        }

        const usersPerMonth = [] 
        if ( 'usersPerMonth' in stats && stats.usersPerMonth.length > 0 ) {
            for(const month of stats.usersPerMonth) {
                usersPerMonth.push(
                    <div key={month.month} className="admin-dashboard__row">
                        <div className="admin-dashboard__users-per-month__month">
                            { new Date(month.month).toLocaleString('default', { timeZone: "UTC", month: 'long', year: 'numeric' }) }
                        </div>
                        <div className="admin-dashboard__users-per-month__users">{ month.users }</div>
                    </div>
                )
            }
        }

        const postsPerMonth = [] 
        if ( 'postsPerMonth' in stats && stats.postsPerMonth.length > 0 ) {
            for(const month of stats.postsPerMonth) {
                postsPerMonth.push(
                    <div key={month.month} className="admin-dashboard__row">
                        <div className="admin-dashboard__posts-per-month__month">
                            { new Date(month.month).toLocaleString('default', { timeZone: "UTC", month: 'long', year: 'numeric' }) }
                        </div>
                        <div className="admin-dashboard__posts-per-month__posts">{ month.posts}</div>
                    </div>
                )
            }
        }

        const moderationsPerMonth = [] 
        if ( 'moderationsPerMonth' in stats && stats.moderationsPerMonth.length > 0 ) {
            for(const month of stats.moderationsPerMonth) {
                moderationsPerMonth.push(
                    <div key={month.month} className="admin-dashboard__row">
                        <div className="admin-dashboard__moderations-per-month__month">
                            { new Date(month.month).toLocaleString('default', { timeZone: "UTC", month: 'long', year: 'numeric' }) }
                        </div>
                        <div className="admin-dashboard__moderations-per-month__posts">{ month.moderations}</div>
                    </div>
                )
            }
        }

        return (
            <div className="admin-dashboard">
                <h2>Dashboard</h2>
                <div className="admin-dashboard__grid">
                    <Card className="admin-dashboard__users-per-month">
                        <div className="admin-dashboard__header">New Users Per Month</div>
                        <div className="admin-dashboard__body">
                            { usersPerMonth }
                        </div>
                    </Card>
                    <Card className="admin-dashboard__daily-active-users">
                        <div className="admin-dashboard__header">Daily Active Users</div>
                        <div className="admin-dashboard__body">
                        </div>
                    </Card>
                    <Card className="admin-dashboard__monthly-active-users">
                        <div className="admin-dashboard__header">Monthly Active Users</div>
                        <div className="admin-dashboard__body">
                        </div>
                    </Card>
                    <Card className="admin-dashboard__posts-per-month">
                        <div className="admin-dashboard__header">Posts per Month</div>
                        <div className="admin-dashboard__body">
                            { postsPerMonth }
                        </div>
                    </Card>
                    <Card className="admin-dashboard__moderation-requests-per-month">
                        <div className="admin-dashboard__header">Moderation Requests per Month</div>
                        <div className="admin-dashboard__body">
                            { moderationsPerMonth }
                        </div>
                    </Card>
                </div>
            </div>
        )
    } catch (error) {
        logger.error(error)
        return (
            <div className="admin-dashboard">
                <h2>Dashboard</h2>
                <p>Failed to load admin dashboard due to uncaught error: { error.message }</p>
            </div>
        )
    }
}

export default AdminDashboard
