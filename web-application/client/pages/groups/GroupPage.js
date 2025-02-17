import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, NavLink, Routes, Route } from 'react-router-dom'

import {
    QueueListIcon as QueueListIconOutline,
    UserGroupIcon as UserGroupIconOutline,
    GlobeAltIcon,
    LockOpenIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline'

import { 
    QueueListIcon as QueueListIconSolid, 
    UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

import PostPage from '/pages/posts/PostPage'

import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import GroupImage from '/components/groups/view/GroupImage'
import Feed from '/components/feeds/Feed'
import GroupInvite from '/components/groups/components/GroupInvite'
import GroupMembersList from '/components/groups/members/list/GroupMembersList'

import { Page, PageLeftGutter, PageRightGutter, PageBody } from '/components/generic/Page'
import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {

    const { slug } = useParams()

    const [request, makeRequest] = useRequest()

    const id = useSelector((state) => 'GroupPage' in state.groups.queries ? state.groups.queries['GroupPage'].list[0] : null)
    const group = useSelector((state) => id !== null && id in state.groups.dictionary ? state.groups.dictionary[id] : null)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => id && id in state.groupMembers.byGroupAndUser && currentUser.id in state.groupMembers.byGroupAndUser[id] ? state.groupMembers.byGroupAndUser[id][currentUser.id] : null)

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
            <div id="group-page">
                <Error404 />
            </div>
        )
    }

    let type = ''
    if ( group.type == 'open' ) {
        type = ( <span><GlobeAltIcon /> Open</span>)
    } else if ( group.type == 'private' ) {
        type = (<span><LockOpenIcon /> Private</span>)
    } else if ( group.type == 'hidden' ) {
        type = (<span><LockClosedIcon /> Hidden</span>)
    }

    const isPrivate = group.type !== 'open' && ( ! currentMember || currentMember.status != 'member')
    return (
        <Page id="group-page">
            <PageLeftGutter>
                <div className="group-page__header">
                    <GroupImage groupId={group.id} />
                    <div className="title"> { group.title}</div>
                    <div className="type">{ type }</div>
                </div>
                <div className="group-page__controls">
                    <GroupMembershipButton groupId={group.id} userId={currentUser.id} />
                </div>
                { ! isPrivate && <menu className="group-page__menu">
                    <li><NavLink to={`/group/${group.slug}`} className="left-end" end><QueueListIconOutline className="outline" /><QueueListIconSolid className="solid" /><span className="nav-text"> Feed</span></NavLink></li>
                    <li><NavLink to="members" className="right-end" end><UserGroupIconOutline className="outline" /><UserGroupIconSolid className="solid" /><span className="nav-text"> Members</span></NavLink></li>
                </menu> }
                <div className="details">
                    <div className="about"> { group.about }</div>
                </div>
            </PageLeftGutter>
            <PageBody>
            <div className="group-page__grid">
                <div className='main'>
                    <Routes>
                        <Route path="members" element={
                            <div>
                                { ! isPrivate && <div>
                                    { currentMember && (currentMember.role == 'admin' || currentMember.role == 'moderator') 
                                        && <GroupInvite groupId={group.id} /> }
                                    <GroupMembersList groupId={group.id} />
                                </div> }
                                { isPrivate && <div className="group-page__private">The contents of this group are private.</div> }
                            </div>
                        } />
                        <Route path=":postId" element={ <PostPage /> } />
                        <Route index element={
                            <div>
                                { ! isPrivate && <Feed type="group" /> }
                                { isPrivate && <div className="group-page__private">The contents of this group are private.</div> }
                            </div>} />
                    </Routes> 
                </div>
            </div>
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )

}

export default GroupPage
