import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, NavLink, Routes, Route } from 'react-router-dom'

import {
    GlobeAltIcon,
    LockOpenIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline'

import { useGroupFromSlug, useGroupMember } from '/lib/hooks/group'

import { canView, canModerate, canAdmin } from '/lib/group'

import PostPage from '/pages/posts/PostPage'

import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import GroupImage from '/components/groups/view/GroupImage'

import GroupMembersView from '/pages/group/views/GroupMembersView'
import GroupFeedView from '/pages/group/views/GroupFeedView'
import GroupSettingsView from '/pages/group/views/GroupSettingsView'

import { NavigationMenu, NavigationMenuItem } from '/components/generic/NavigationMenu'
import { Page, PageLeftGutter, PageRightGutter, PageBody } from '/components/generic/Page'
import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {

    const { slug } = useParams()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupError, request] = useGroupFromSlug(slug)
    const [currentMember, currentMemberError] = useGroupMember(group?.id, currentUser?.id)


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
                    <GroupMembershipButton groupId={group.id} userId={currentUser?.id} />
                </div>
                { canView(group, currentMember) && <NavigationMenu className="group-page__menu">
                    <NavigationMenuItem to={`/group/${group.slug}`} icon="QueueList" text="Feed" />
                    <NavigationMenuItem to="members" icon="UserGroup" text="Members" />
                    { canAdmin(group, currentMember) && <NavigationMenuItem to="settings" icon="Cog6Tooth" text="Settings" /> }
                </NavigationMenu> }
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
