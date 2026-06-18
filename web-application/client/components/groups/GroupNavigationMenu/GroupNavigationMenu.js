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

import { useSelector } from 'react-redux'

import can, { Actions, Entities } from '/lib/permission'
import { isNativePlatform } from '/lib/native'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useFeature } from '/lib/hooks/feature'

import { NavigationMenu, NavigationMenuLink, NavigationMenuButton, NavigationSubmenu, NavigationSubmenuLink, NavigationMenuItem } from '/components/ui/NavigationMenu'

import GroupMembershipButton from '/components/groups/GroupMembershipButton'

import CopyGroupLink from './CopyGroupLink'
import LeaveGroupAction from './LeaveGroupAction'
import FlagGroupAction from './FlagGroupAction'

const GroupNavigationMenu = function({ groupId }) {

    const appBuild = useSelector((state) => state.system.appBuild)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [context, requests] = useGroupPermissionContext(currentUser, groupId)

    const group = context?.group
    const currentMember = context?.userMember

    const isMember = currentMember?.status === 'member'
    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)
    const canCreateGroupPost = can(currentUser, Actions.create, Entities.GroupPost, context)
    const canQueryGroupMember = can(currentUser, Actions.query, Entities.GroupMember, context)
    const canViewGroupPost = can(currentUser, Actions.view, Entities.GroupPost, context)
    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context)
    const canAdminGroup = can(currentUser, Actions.admin, Entities.Group, context)

    const canAdminSite = can(currentUser, Actions.admin, Entities.Site)

    const hasSubgroups = useFeature('issue-165-subgroups')
    const hasFlagProfilesAndGroups = useFeature('feat-408-flag-profiles-and-groups')

    // ========================================================================
    //          Render
    // ========================================================================

    if ( canViewGroup !== true ) {
        return null
    }

    if ( ! group || ! currentUser ) {
        return null
    }

    return (
        <NavigationMenu className="group-navigation-menu" ariaLabel="Group">
            { ! isMember && <NavigationMenuItem><GroupMembershipButton groupId={group.id} userId={currentUser.id} /></NavigationMenuItem> }
            { canCreateGroupPost === true && <NavigationMenuButton href={`/create?groupId=${group.id}&origin=${encodeURIComponent(`/group/${group.slug}`)}`} icon="Plus" type="primary" text="Create" />  }
            { canViewGroupPost === true && <NavigationMenuLink to={`/group/${group.slug}`} icon="QueueList" text="Feed" /> }
            { canQueryGroupMember === true && <NavigationSubmenu  icon="Users" title="Members"> 
                <NavigationSubmenuLink to={`/group/${group.slug}/members`} icon="Users" text="Members" />
                <NavigationSubmenuLink to={`/group/${group.slug}/members/admin`} icon="ExclamationTriangle" text="Administrators" />
                { isMember && canModerateGroup === true && <NavigationSubmenuLink to={`/group/${group.slug}/members/invitations`} icon="UserPlus" text="Invitations" /> }
                { isMember && canModerateGroup === true
                    && ( group.type === 'private' || group.type === 'private-open' || group.type === 'hidden-private' )
                    && <NavigationSubmenuLink to={`/group/${group.slug}/members/requests`} icon="UserPlus" text="Requests" /> }
                { isMember && canModerateGroup === true && <NavigationSubmenuLink to={`/group/${group.slug}/members/banned`} icon="XCircle" text="Banned Users" /> }
                { isMember && canModerateGroup === true && <NavigationSubmenuLink to={`/group/${group.slug}/members/email-invitations`} icon="Envelope" text="Email Invitations" /> }
            </NavigationSubmenu>}
            { hasSubgroups && canViewGroupPost === true && <NavigationMenuLink to={`/group/${group.slug}/subgroups`} icon="UserGroup" text="Subgroups" /> }
            <NavigationSubmenu icon="EllipsisHorizontal" title="More">
                <NavigationSubmenuLink to={`/group/${group.slug}/about`} icon="QuestionMarkCircle" text="About" />
                { hasFlagProfilesAndGroups && <FlagGroupAction groupId={group.id} /> }
                { ( ! isNativePlatform() || appBuild >= 15 ) && <CopyGroupLink groupId={group.id} /> }
                { canModerateGroup === true && <NavigationSubmenuLink to="moderation" icon="Flag" text="Moderation" /> }
                { canAdminGroup === true && <NavigationSubmenuLink to="settings" icon="Cog6Tooth" text="Settings" /> }
                { isMember && <LeaveGroupAction groupId={group.id} /> }
            </NavigationSubmenu> 
        </NavigationMenu> 
    )
}

export default GroupNavigationMenu
