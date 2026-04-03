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
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import logger from '/logger'

import { getStats } from '/state/admin'

import { useRequest } from '/lib/hooks/useRequest'

import Card from '/components/ui/Card'
import Spinner from '/components/Spinner'
import ComponentErrorBoundary from '/components/errors/ComponentErrorBoundary'

import './AdminDashboard.css'

const AdminDashboardElementData = function({ stats }) {
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
        <div className="admin-dashboard-element__data">
            { views }
        </div>

    )
}

const AdminDashboardElement = function({ className, title, stats }) {
    return (
        <Card className={className}>
            <ComponentErrorBoundary fallback={<span>Failed to load { title }</span>}>
                <div className="admin-dashboard-element__header">{ title }</div>
                <AdminDashboardElementData stats={stats} />
            </ComponentErrorBoundary>
        </Card>
    )
}

const AdminDashboardData = function() {
    const stats = useSelector((state) => state.admin.stats)
    const [ request, makeRequest ] = useRequest()
    const [ error, setError ] = useState(false)

    useEffect(() => {
        try {
            makeRequest(getStats())
        } catch (error) {
            setError(true)
            logger.error(error)
        }
    }, [])

    if ( error ) {
        return (
            <div className="admin-dashboard-data">
                Error occurred while loading stats.
            </div>
        )
    }

    if ( ! request || request?.state === 'pending') {
        return (
            <div className="admin-dashboard-data">
                <Spinner />
            </div>
        )
    } else if ( request?.state === 'failed' ) {
        return (
            <div className="admin-dashboard-data">
                Request failed.  Try refreshing to reload.
            </div>
        )
    }

    return (
        <div className="admin-dashboard-data admin-dashboard-data__grid">
            <AdminDashboardElement title="Users per Month" stats={stats.usersPerMonth} />
            <AdminDashboardElement title="Daily Active Users" />
            <AdminDashboardElement title="Monthly Active Users" />
            <AdminDashboardElement title="Posts Per Month" stats={stats.postsPerMonth} />
            <AdminDashboardElement title="Moderation Requests per Month" stats={stats.moderationsPerMonth} />
        </div>
    )
}

const AdminDashboard = function() {
    return (
        <div className="admin-dashboard">
            <h2>Dashboard</h2>
            <ComponentErrorBoundary fallback={<span>Dashboard failed to load.</span>}>
                <AdminDashboardData />
            </ComponentErrorBoundary>
        </div>
    )
}

export default AdminDashboard
