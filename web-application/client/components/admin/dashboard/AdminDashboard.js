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
import ComponentErrorBoundary from '/components/errors/ComponentErrorBoundary'

import './AdminDashboard.css'

const AdminDashboardElement = function({ className, title, stats }) {

    const views = []
    if ( stats !== undefined && stats !== null && stats.length > 0 ) {
        for(const row of stats ) {
            views.push(
                <div key={row.month} className="admin-dashboard-element__row">
                    <div>
                        { new Date(row.month).toLocaleString('default', { timeZone: "UTC", month: 'long', year: 'numeric' }) }
                    </div>
                    <div>{ row.stat}</div>
                </div>
            )
        }
    }

    return (
        <ComponentErrorBoundary fallback={<Card className={className}>Failed to load { title }</Card>}>
            <Card className={className}>
                <div className="admin-dashboard-element__header">{ title }</div>
                <div className="admin-dashboard-element__body">
                    { views }
                </div>
            </Card>
        </ComponentErrorBoundary>
    )
}

const AdminDashboard = function() {
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

    return (
        <ComponentErrorBoundary fallback={<div className="admin-dashboard">Dashboard failed to load.</div>}>
            <div className="admin-dashboard">
                <h2>Dashboard</h2>
                <div className="admin-dashboard__grid">
                    <AdminDashboardElement title="Users per Month" stats={stats.usersPerMonth} />
                    <AdminDashboardElement title="Daily Active Users" />
                    <AdminDashboardElement title="Monthly Active Users" />
                    <AdminDashboardElement title="Posts Per Month" stats={stats.postsPerMonth} />
                    <AdminDashboardElement title="Moderation Requests per Month" stats={stats.moderationsPerMonth} />
                </div>
            </div>
        </ComponentErrorBoundary>
    )
}

export default AdminDashboard
