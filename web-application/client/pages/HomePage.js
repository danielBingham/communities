import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import FeedMenu from '/components/feeds/menu/FeedMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './HomePage.css'

const HomePage = function() {

    const features = useSelector((state) => state.system.features)

    const hasGroups = '19-private-groups' in features

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    return (
        <Page id="home-page">
            <PageLeftGutter className="home-page__sidebar">
                { hasGroups && <FeedMenu /> }
            </PageLeftGutter>
            <PageBody className="content">
                <div className="feed">
                    <Outlet />
                </div>
            </PageBody>
            <PageRightGutter className="home-page_right-gutter">
            </PageRightGutter>
        </Page>
    )
}

export default HomePage
