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

    if ( member === undefined || member === null ) {
        return false
    }

    if ( member.groupId === group.id
        && member.status === 'member' 
        && member.role === 'admin') 
    {
        return true 
    }

    return false
}

const isModerator = function(member, group) {
    if ( group === undefined || group === null ) {
        return false
    }

    if ( member === undefined || member === null ) {
        return false
    }

    if ( member.groupId === group.id
        && member.status === 'member' 
        && member.role === 'moderator') 
    {
        return true 
    }

    return false

}


const canAdminGroup = function(user, context) {
    if ( ! ('group' in context) || context.group === undefined || context.group === null ) {
        return false
    }

    // TODO This is a really blunt tool.  Lets create something more granular in the future.
    // SiteModerators can admin groups in order to remove.
    if ( user.siteRole === 'admin' || user.siteRole === 'superadmin' ) {
        return true
    }

    // If we have the ancestors, then check the ancestors.
    //
    // If they are an admin on any ancestor group, then they can admin this
    // group.
    if ( 'ancestors' in context && 'ancestorMembers' in context ) {
        for(const ancestor of context.ancestors) {
            if ( isAdmin(context.ancestorMembers[ancestor.id], ancestor) ) {
                return true
            }
        }
    }

    // At this point, they can only admin if they are a member.
    if ( ! ('userMember' in context) || context.userMember === undefined || context.userMember === null ) {
        return false
    }

    if ( user.id !== context.userMember.id ) {
        return false
    }

    // Always exclude banned members.
    if (  context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    if ( isAdmin(context.userMember, context.group) === true ) {
        return true
    }

    return false
}

const canModerateGroup = function(user, context) {
    if ( ! ('group' in context) || context.group === undefined || context.group === null ) {
        return false
    }

    // TODO This is a really blunt tool.  Lets create something more granular in the future.
    // SiteModerators can admin groups in order to remove.
    if ( user.siteRole === 'admin' || user.siteRole === 'superadmin' ) {
        return true
    }

    // If they can admin the group, then they can moderate it.
    if ( canAdminGroup(user, context) === true ) {
        return true
    }

    // At this point, they can only moderate if they are a member.
    if ( ! ('userMember' in context) || context.userMember === undefined || context.userMember === null ) {
        return false
    }

    if ( user.id !== context.userMember.id ) {
        return false
    }

    // Always exclude banned members.
    if ( context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    if ( isModerator(context.userMember, context.group) === true ) 
    {
        return true 
    }

    return false 
}

const canCreateGroup = function(user, context) {
    // If `group` exists, it's the parent group and their ability to create
    // depends on their permissions in the parent group.  If group is not
    // present, then this is a new top level group and anyone can create it.
    if ( ! ('group' in context) || context.group === undefined || context.group === null ) {
        return true 
    }

    return canAdminGroup(user, context)
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

    // Anyone can view these groups.
    if ( context.group.type === 'open' || context.group.type == 'private' || context.group.type === 'private-open') {
        return true
    }

    // For `hidden-open` and `hidden-private` groups they can see it if they
    // are a member of the parent group.
    if ( context.group.type === 'hidden-open' || context.group.type === 'hidden-private' ) {
        if ( 'parentMember' in context && context.parentMember !== undefined && context.parentMember !== null
            && context.parentMember.userId === user.id && context.parentMember.groupId === context.group.parentId
            && context.parentMember.status !== 'banned' 
        ) {
            return true
        }
    }

    // At this point, 'hidden' is all that is left and hidden groups can only
    // be seen by their members and invitees.
    if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null 
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
