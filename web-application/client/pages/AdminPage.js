import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom'

import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import AdminDashboard from '/components/admin/dashboard/AdminDashboard'
import FeatureFlags from '/components/admin/features/FeatureFlags'

import './AdminPage.css'

const AdminPage = function(props) {


    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Effect Handling ======================================
   
    const navigate = useNavigate()

    // Only admins and superadmins may be here.
    useEffect(function() {
        if ( ! currentUser || (currentUser.permissions != 'admin' && currentUser.permissions != 'superadmin')) {
            navigate("/")
        }
    }, [ currentUser ])

    // ======= Render ===============================================

    return (
        <Page id="admin">
            <PageLeftGutter>
                <menu className="admin__menu">
                    <li><NavLink to={``} end><span className="nav-text"> Dashboard</span></NavLink></li>
                    <li><NavLink to="features" end><span className="nav-text"> Features</span></NavLink></li>
                    <li><NavLink to="users" end><span className="nav-text"> Users</span></NavLink></li>
                </menu> 
            </PageLeftGutter>
            <PageBody>
                <Routes>
                    <Route path="features" element={<FeatureFlags />} />
                    <Route index element={<AdminDashboard />} />
                </Routes>
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default AdminPage

