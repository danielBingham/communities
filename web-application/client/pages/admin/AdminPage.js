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
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom'

import can, { Entities, Actions } from '/lib/permission'

import { useFeature } from '/lib/hooks/feature/useFeature'
import { resetEntities } from '/state/lib'

import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import AdminDashboard from '/components/admin/dashboard/AdminDashboard'
import FeatureFlags from '/components/admin/features/FeatureFlags'
import UserAdminListView from '/pages/admin/views/UserAdminListView'
import AdminModerationView from '/pages/admin/views/AdminModerationView'
import BlocklistView from '/pages/admin/views/BlocklistView'
import UserAdminView from '/pages/admin/views/UserAdminView'

import './AdminPage.css'

const AdminPage = function(props) {
    
    const currentUser = useSelector((state) => state.authentication.currentUser)
   
    const navigate = useNavigate()

    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)
    const canAdminSite = can(currentUser, Actions.admin, Entities.Site)

    // Only admins and superadmins may be here.
    useEffect(function() {
        if ( ! currentUser || canModerateSite !== true) {
            navigate("/")
        }
    }, [ currentUser ])

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    // ======= Render ===============================================

    if ( canModerateSite !== true ) {
        return null
    }

    return (
        <Page id="admin">
            <PageLeftGutter>
                <menu className="admin__menu">
                    <li><NavLink to={``} end><span className="nav-text"> Dashboard</span></NavLink></li>
                    <li><NavLink to="moderation" end><span className="nav-text"> Moderation</span></NavLink></li> 
                    <li><NavLink to="blocklist" end><span className="nav-text">Blocklist</span></NavLink></li>
                    { canAdminSite === true && <li><NavLink to="features" end><span className="nav-text"> Features</span></NavLink></li> }
                    <li><NavLink to="users" end><span className="nav-text"> Users</span></NavLink></li>
                </menu> 
            </PageLeftGutter>
            <PageBody>
                <Routes>
                    { canAdminSite === true && <Route path="features" element={<FeatureFlags />} /> }
                    <Route path="users" element={<UserAdminListView />} />
                    <Route path="user">
                        <Route path=":userId" element={<UserAdminView />} />
                        <Route index element={<UserAdminListView />} />
                    </Route>
                    <Route path="moderation" element={<AdminModerationView />} />
                    <Route path="blocklist" element={<BlocklistView />} />
                    <Route index element={<AdminDashboard />} />
                </Routes>
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default AdminPage

