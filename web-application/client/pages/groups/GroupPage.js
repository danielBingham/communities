import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, NavLink, Routes, Route } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

import GroupFeed from '/components/groups/feed/GroupFeed'
import GroupView from '/components/groups/view/GroupView'
import GroupImage from '/components/groups/view/GroupImage'


import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {

    const { slug } = useParams()

    const [request, makeRequest] = useRequest()

    const id = useSelector((state) => 'GroupPage' in state.groups.queries ? state.groups.queries['GroupPage'].list[0] : null)
    const group = useSelector((state) => id !== null && id in state.groups.dictionary ? state.groups.dictionary[id] : null)

    useEffect(() => {
            makeRequest(getGroups('GroupPage', { slug: slug }))
    }, [ slug ])

    if ( ! group && ( ! request || request.state == 'pending') )  {
        return (
            <div id="group-page">
                <Spinner />
            </div>
        )
    } else if ( ! group ) {
        // The request won't failed, because it's a search request.  So it will
        // just return an empty result.
        return (
            <div id="user-profile-page">
                <Error404 />
            </div>
        )
    }

    return (
        <div id="group-page">
            <div className="group-page__grid">
                <div className='group-page__right-sidebar'>
                    <article id={ group.id } className='group-view'>
                        <GroupImage groupId={group.id} />
                        <div className="details">
                            <div className="title"> { group.title}</div>
                            <div className="type">{ group.type }</div>
                            <div className="group-page__header">
                                <menu className="group-page__controls">
                                    <li><NavLink to={`/group/${group.slug}`} className="left-end" end>Feed</NavLink></li>
                                    <li><NavLink to="members" className="right-end" end>Members</NavLink></li>
                                </menu>
                            </div>
                            <div className="about"> { group.about }</div>
                        </div>
                    </article>
                </div>
                <div className='main'>
                    <Routes>
                        <Route index element={<GroupFeed id={id} />} />
                    </Routes> 
                </div>
            </div>
        </div>
    )

}

export default GroupPage
