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
const isAdmin = function(member, group) {
    if ( group === undefined || group === null ) {
        return false
    }

    if ( member !== undefined && member !== null 
        && member.groupId === group.id
        && member.status === 'member' 
        && member.role === 'admin') 
    {
        return true 
    }
}


const canAdminGroup = function(user, context) {
    if ( context.group === undefined || context.group === null ) {
        return false
    }

    // TODO This is a really blunt tool.  Lets create something more granular in the future.
    // SiteModerators can admin groups in order to remove.
    if ( user.siteRole === 'admin' || user.siteRole === 'superadmin' ) {
        return true
    }

    // If they are an admin on a parent group, then they can admin this group.


    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    if ( context.userMember !== undefined && context.userMember !== null 
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'member' 
        && context.userMember.role === 'admin') 
    {
        return true 
    }
    
    return false 
}

const canModerateGroup = function(user, context) {
    if ( context.group === undefined || context.group === null ) {
        return false
    }

    // TODO This is a really blunt tool.  Lets create something more granular in the future.
    // SiteModerators can admin groups in order to remove.
    if ( user.siteRole === 'admin' || user.siteRole === 'superadmin' ) {
        return true
    }

    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    if ( context.userMember !== undefined && context.userMember !== null 
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'member' 
        && (context.userMember.role === 'moderator' || context.userMember.role === 'admin')) 
    {
        return true 
    }

    return false 
}

const canCreateGroup = function(user, context) {
    if ( context.group === undefined || context.group === null ) {
        return false
    }

    if ( 'parentId' in context.group ) {
        const parentContext = {
            group: context.parentGroup,
            userMember: context.parentMember
        }
        return canAdminGroup(user, parentContext)
    }

    return true
}

const canViewGroup = function(user, context) {
    if ( context.canModerateSite === true ) {
        return true
    }

    if ( context.group === undefined || context.group === null ) {
        return false
    }

    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }


    if ( context.group.type === 'open' || context.group.type == 'private') {
        return true
    }

    if ( context.userMember !== undefined && context.userMember !== null 
        && context.userMember.groupId === context.group.id
        && context.userMember.status !== 'banned' ) 
    {
        return true 
    }

    return false 
}

const canUpdateGroup = function(user, context) {
    return canAdminGroup(user, context)
}

const canDeleteGroup = function(user, context) {
    return canAdminGroup(user, context)
}

module.exports = {
    canAdminGroup: canAdminGroup,
    canModerateGroup: canModerateGroup,
    canCreateGroup: canCreateGroup,
    canViewGroup: canViewGroup,
    canUpdateGroup: canUpdateGroup,
    canDeleteGroup: canDeleteGroup,
}
