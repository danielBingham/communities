import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import { NavigationMenu, NavigationMenuItem, NavigationMenuButton } from '/components/generic/NavigationMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './GroupsPage.css'

const GroupsPage = function() {

    const navigate = useNavigate()

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    return (
        <Page id="groups-page">
            <PageLeftGutter>
                <NavigationMenu className="groups-page__menu">
                    <NavigationMenuButton 
                        type="primary" 
                        onClick={() => navigate('/groups/create')} 
                        icon="Plus"
                        text="Create Group" />
                    <NavigationMenuItem to="/groups" icon="UserGroup" text="Your Groups" />
                    <NavigationMenuItem to="/groups/find" icon="MagnifyingGlass" text="Find Groups" />
                </NavigationMenu>
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
