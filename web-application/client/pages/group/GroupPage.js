import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, NavLink, Routes, Route } from 'react-router-dom'

import {
    GlobeAltIcon,
    LockOpenIcon,
    LockClosedIcon,
    UserGroupIcon,
    DocumentCheckIcon,
    PlusIcon
} from '@heroicons/react/24/outline'

import { resetEntities } from '/state/lib'

import { useGroupFromSlug } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { 
    GroupPermissions, useGroupPermission, 
    GroupMemberPermissions, useGroupMemberPermission, 
    GroupPostPermissions, useGroupPostPermission 
} from '/lib/hooks/permission'

import Button from '/components/ui/Button'

import PostView from '/pages/posts/views/PostView'

import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import GroupImage from '/components/groups/view/GroupImage'

import GroupMembersView from '/pages/group/views/GroupMembersView'
import GroupInviteView from '/pages/group/views/GroupInviteView'
import GroupEmailInviteView from '/pages/group/views/GroupEmailInviteView'
import GroupFeedView from '/pages/group/views/GroupFeedView'
import GroupModerationView from '/pages/group/views/GroupModerationView'
import GroupSettingsView from '/pages/group/views/GroupSettingsView'

import { NavigationMenu, NavigationMenuLink, NavigationSubmenu, NavigationSubmenuLink, NavigationMenuItem} from '/components/ui/NavigationMenu'
import { Page, PageLeftGutter, PageRightGutter, PageBody } from '/components/generic/Page'
import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {

    const { slug } = useParams()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, request] = useGroupFromSlug(slug)
    const [currentMember, memberRequest ] = useGroupMember(group?.id, currentUser?.id)

    const context = {
        group: group,
        userMember: currentMember
    }

    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, context)
    const canQueryGroupMember = useGroupMemberPermission(currentUser, GroupMemberPermissions.QUERY, context)
    const canViewGroupPost = useGroupPostPermission(currentUser, GroupPostPermissions.VIEW, context)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, context)
    const canAdminGroup = useGroupPermission(currentUser, GroupPermissions.ADMIN, context)

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    if (  ( group === undefined || request?.state == 'pending')
            || ( currentMember === undefined  || memberRequest?.state === 'pending'))
    {
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

    if ( ! group ) {
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

    let type = ''
    if ( group.type == 'open' ) {
        type = ( <span><GlobeAltIcon /> Public</span>)
    } else if ( group.type == 'private' ) {
        type = (<span><LockOpenIcon /> Private</span>)
    } else if ( group.type == 'hidden' ) {
        type = (<span><LockClosedIcon /> Hidden</span>)
    }

    let postingPermissions = ''
    if ( group.postPermissions === 'anyone' ) {
        postingPermissions = ( <span><GlobeAltIcon /> Anyone may Post</span> )
    } else if ( group.postPermissions === 'members' ) {
        postingPermissions = ( <span><UserGroupIcon /> Members may Post</span> )
    } else if ( group.postPermissions === 'approval' ) {
        postingPermissions = ( <span><DocumentCheckIcon /> Posts Require Approval</span> )
    } else if ( group.postPermissions === 'restricted' ) {
        postingPermissions = ( <span><LockClosedIcon /> Only Moderators may Post</span> )
    }

    return (
        <Page id="group-page">
            <PageLeftGutter>
                { canViewGroup === true && <NavigationMenu className="group-page__menu">
                    <NavigationMenuItem><Button type="primary"><PlusIcon /> Create Post</Button></NavigationMenuItem> 
                    { canViewGroupPost === true && <NavigationMenuLink to={`/group/${group.slug}`} icon="QueueList" text="Feed" /> }
                    { canQueryGroupMember === true && <NavigationSubmenu  icon="UserGroup" title="Members"> 
                        <NavigationSubmenuLink to={`/group/${group.slug}/members`} icon="UserGroup" text="Members" />
                        <NavigationSubmenuLink to={`/group/${group.slug}/members/admin`} icon="ExclamationTriangle" text="Administrators" />
                        { canModerateGroup && <NavigationSubmenuLink to={`/group/${group.slug}/members/invitations`} icon="UserPlus" text="Invitations" /> }
                        { canModerateGroup && group.type === 'private' && <NavigationSubmenuLink to={`/group/${group.slug}/members/requests`} icon="UserPlus" text="Requests" /> }
                        { canModerateGroup && <NavigationSubmenuLink to={`/group/${group.slug}/members/banned`} icon="XCircle" text="Banned Users" /> }
                        { canModerateGroup && <NavigationSubmenuLink to={`/group/${group.slug}/members/email-invitations`} icon="Envelope" text="Email Invitations" /> }

                    </NavigationSubmenu>}
                    { canModerateGroup === true && <NavigationMenuLink to="moderation" icon="Flag" text="Moderation" /> }
                    { canAdminGroup === true && <NavigationMenuLink to="settings" icon="Cog6Tooth" text="Settings" /> }
                    <NavigationMenuItem><GroupMembershipButton groupId={group.id} userId={currentUser?.id} /></NavigationMenuItem>
                </NavigationMenu> }
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
                <div className="group-page__header">
                    <GroupImage groupId={group.id} />
                    <div className="title">{ group.title}</div>
                    <div className="types">
                        <span className="type">{ type }</span>
                        <span className="post-permissions">{ postingPermissions }</span>
                    </div>
                </div>
                <div className="details">
                    <div className="about"> { group.about }</div>
                </div>
            </PageRightGutter>
        </Page>
    )
}

export default GroupPage
