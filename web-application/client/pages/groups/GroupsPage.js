import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

import { 
    MagnifyingGlassIcon as MagnifyingGlassOutline,
    UserGroupIcon as UserGroupIconOutline,
    UserPlusIcon as UserPlusIconOutline
} from '@heroicons/react/24/outline'

import { 
    MagnifyingGlassIcon as MagnifyingGlassSolid,
    UserGroupIcon as UserGroupIconSolid,
    UserPlusIcon as UserPlusIconSolid,
    PlusIcon as PlusIconSolid
} from '@heroicons/react/24/solid'

import Button from '/components/generic/button/Button'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './GroupsPage.css'

const GroupsPage = function() {

    const navigate = useNavigate()

    return (
        <Page id="groups-page">
            <PageLeftGutter>
                <menu className="groups-page__menu">
                    <li><Button type="primary" onClick={() => navigate('/groups/create')}><PlusIconSolid /> Create Group</Button></li>
                    <li><NavLink to="/groups" end>
                        <UserGroupIconSolid className="solid" /><UserGroupIconOutline className="outline" /> <span className="nav-text">Your Groups</span>
                    </NavLink> </li>
                    <li><NavLink to="/groups/find" end>
                        <MagnifyingGlassSolid className="solid" /><MagnifyingGlassOutline className="outline" /> <span className="nav-text">Find Groups</span>
                    </NavLink></li>
                </menu>
            </PageLeftGutter>
            <PageBody className="content">
                { <Outlet /> }
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default GroupsPage
