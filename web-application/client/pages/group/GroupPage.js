import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, NavLink, Routes, Route } from 'react-router-dom'

import {
    QueueListIcon as QueueListIconOutline,
    UserGroupIcon as UserGroupIconOutline,
    Cog6ToothIcon as Cog6ToothIconOutline,
    GlobeAltIcon,
    LockOpenIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline'

import { 
    QueueListIcon as QueueListIconSolid, 
    UserGroupIcon as UserGroupIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupFromSlug, useCurrentGroupMember } from '/lib/hooks/group'

import { canView, canModerate, canAdmin } from '/lib/group'

import { getGroups } from '/state/groups'

import PostPage from '/pages/posts/PostPage'

import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import GroupImage from '/components/groups/view/GroupImage'

import GroupMembersView from '/pages/group/views/GroupMembersView'
import GroupFeedView from '/pages/group/views/GroupFeedView'
import GroupSettingsView from '/pages/group/views/GroupSettingsView'

import { Page, PageLeftGutter, PageRightGutter, PageBody } from '/components/generic/Page'
import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {

    const { slug } = useParams()

    const [group, groupError, request] = useGroupFromSlug(slug, [ 'GroupMembers' ])
    const [currentMember, currentMemberError] = useCurrentGroupMember(group?.id)


    if ( ! group && ( ! request || request.state == 'pending') )  {
        return (
            <div id="group-page">
                <Spinner />
            </div>
        )
    } else if ( ! group ) {
        // The request won't be failed, because it's a search request.  So it will
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

    return (
        <Page id="group-page">
            <PageLeftGutter>
                <div className="group-page__header">
                    <GroupImage groupId={group.id} />
                    <div className="title">{ group.title}</div>
                    <div className="type">{ type }</div>
                </div>
                <div className="group-page__controls">
                    { currentMember && <GroupMembershipButton groupId={group.id} userId={currentMember.userId} /> }
                </div>
                { canView(group, currentMember) && <menu className="group-page__menu">
                    <li><NavLink to={`/group/${group.slug}`} end><QueueListIconOutline className="outline" /><QueueListIconSolid className="solid" /><span className="nav-text"> Feed</span></NavLink></li>
                    <li><NavLink to="members" end><UserGroupIconOutline className="outline" /><UserGroupIconSolid className="solid" /><span className="nav-text"> Members</span></NavLink></li>
                    { canAdmin(group, currentMember) && <li><NavLink to="settings" end><Cog6ToothIconOutline className="outline" /><Cog6ToothIconSolid className="solid" /><span className="nav-text"> Settings</span></NavLink></li> }
                </menu> }
                <div className="details">
                    <div className="about"> { group.about }</div>
                </div>
            </PageLeftGutter>
            <PageBody>
                <div className="group-page__main">
                    <Routes>
                        <Route path="members" element={ <GroupMembersView groupId={group.id} /> } />
                        <Route path="settings" element={<GroupSettingsView groupId={group.id} /> } />
                        <Route path=":postId" element={ <PostPage /> } />
                        <Route index element={<GroupFeedView groupId={group.id} />} />
                    </Routes> 
                </div>
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )

}

export default GroupPage
