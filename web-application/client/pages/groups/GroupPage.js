import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, NavLink, Routes, Route } from 'react-router-dom'

import {
    QueueListIcon as QueueListIconOutline,
    UserGroupIcon as UserGroupIconOutline
} from '@heroicons/react/24/outline'

import { 
    EllipsisHorizontalIcon, 
    QueueListIcon as QueueListIconSolid, 
    UserGroupIcon as UserGroupIconSolid
} from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

import PostPage from '/pages/posts/PostPage'

import Feed from '/components/feeds/Feed'
import GroupView from '/components/groups/view/GroupView'
import GroupMembersList from '/components/groups/members/list/GroupMembersList'
import GroupActionMenu from '/components/groups/components/GroupActionMenu'

import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {

    const { slug } = useParams()

    const [request, makeRequest] = useRequest()

    const id = useSelector((state) => 'GroupPage' in state.groups.queries ? state.groups.queries['GroupPage'].list[0] : null)
    const group = useSelector((state) => id !== null && id in state.groups.dictionary ? state.groups.dictionary[id] : null)

    useEffect(() => {
        makeRequest(getGroups('GroupPage', { slug: slug, relations: [ 'GroupMembers' ] }))
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
            <menu className="group-page__menu">
                <li>
                    <GroupActionMenu groupId={id} />
                </li>
                <li><NavLink to={`/group/${group.slug}`} className="left-end" end><QueueListIconOutline className="outline" /><QueueListIconSolid className="solid" /><span className="nav-text"> Feed</span></NavLink></li>
                <li><NavLink to="members" className="right-end" end><UserGroupIconOutline className="outline" /><UserGroupIconSolid className="solid" /><span className="nav-text"> Members</span></NavLink></li>
            </menu>
            <div className="group-page__grid">
                <div> 
                    <GroupView id={id} />
                </div>
                <div className='main'>
                    <Routes>
                        <Route path="members" element={ <GroupMembersList groupId={group.id} />} />
                        <Route path=":postId" element={ <PostPage /> } />
                        <Route index element={<Feed type="group" />} />
                    </Routes> 
                </div>
            </div>
        </div>
    )

}

export default GroupPage
