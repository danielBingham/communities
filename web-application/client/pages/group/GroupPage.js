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
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Routes, Route } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import can, { Actions, Entities } from '/lib/permission'

import { useGroupFromSlug, useGroupPermissionContext } from '/lib/hooks/Group'

import PostView from '/pages/posts/views/PostView'

import GroupProfile from '/components/groups/GroupProfile'
import GroupNavigationMenu from '/components/groups/GroupNavigationMenu'

import GroupSubgroupView from '/pages/group/views/GroupSubgroupView'
import GroupMembersView from '/pages/group/views/GroupMembersView'
import GroupInviteView from '/pages/group/views/GroupInviteView'
import GroupEmailInviteView from '/pages/group/views/GroupEmailInviteView'
import GroupFeedView from '/pages/group/views/GroupFeedView'
import GroupModerationView from '/pages/group/views/GroupModerationView'
import GroupSettingsView from '/pages/group/views/GroupSettingsView'

import { Page, PageLeftGutter, PageRightGutter, PageBody } from '/components/generic/Page'
import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {
    const { slug } = useParams()

    const [group, groupRequest ] = useGroupFromSlug(slug)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [context, requests] = useGroupPermissionContext(currentUser, group?.id)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [ slug ])

    if ( group === undefined || groupRequest?.state === 'pending' || requests.hasPending()) {
        return (
            <Page id="group-page">
                <PageLeftGutter>
                </PageLeftGutter>
                <PageBody>
                    <Spinner />
                </PageBody>
                <PageRightGutter>
                </PageRightGutter>
            </Page>
        )
    } 

    if ( group === null ) {
        // The request won't be failed, because it's a search request.  So it will
        // just return an empty result.
        return (
            <Page id="group-page">
                <PageLeftGutter>
                </PageLeftGutter>
                <PageBody>
                    <Error404 />
                </PageBody>
                <PageRightGutter>
                </PageRightGutter>
            </Page>
        )
    }

    if ( canViewGroup !== true ) {
        return (
            <Page id="group-page">
                <PageLeftGutter>
                </PageLeftGutter>
                <PageBody>
                    <Error404 />
                </PageBody>
                <PageRightGutter>
                </PageRightGutter>
            </Page>
        )
    }

    return (
        <Page id="group-page">
            <PageLeftGutter>
                <GroupNavigationMenu groupId={group.id} />
            </PageLeftGutter>
            <PageBody>
                <div className="group-page__main">
                    <Routes>
                        <Route path="members">
                            <Route path="admin" element={ <GroupMembersView groupId={group.id} type="admin" /> } />
                            <Route path="invitations" element={ <GroupMembersView groupId={group.id} type="invitations" /> } />
                            <Route path="requests" element={ <GroupMembersView groupId={group.id} type="requests" /> } />
                            <Route path="banned" element={ <GroupMembersView groupId={group.id} type="banned" /> } />
                            <Route path="email-invitations" element={ <GroupMembersView groupId={group.id} type="email-invitations" /> } />
                            <Route index element={ <GroupMembersView groupId={group.id} type="member" /> } />
                        </Route>
                        <Route path="subgroups" element={ <GroupSubgroupView groupId={group.id} /> } />
                        <Route path="invite" element={ <GroupInviteView groupId={group.id} /> } />
                        <Route path="email-invite" element={ <GroupEmailInviteView groupId={group.id} /> } />
                        <Route path="moderation" element={ <GroupModerationView groupId={group.id} /> } />
                        <Route path="settings" element={<GroupSettingsView groupId={group.id} /> } />
                        <Route path=":postId" element={ <PostView groupId={group.id} /> } />
                        <Route index element={<GroupFeedView groupId={group.id} />} />
                    </Routes> 
                </div>
            </PageBody>
            <PageRightGutter>
                <GroupProfile groupId={group.id} />
            </PageRightGutter>
        </Page>
    )
}

export default GroupPage
