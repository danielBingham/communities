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

const canQueryGroupMember = function(user, context ) {
    // Site Moderators can view GroupMembers.  This is necessary for their
    // moderation duties.
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

    // Anyone can view content of open group.
    if ( context.group.type === 'open' ) {
        return true
    }

    // Otherwise they must be a confirmed member of the group.
    if ( context.userMember !== undefined && context.userMember !== null 
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'member') 
    {
        return true 
    }

    return false 
}

const canViewGroupMember = function(user, context) {
    // If we don't have our context, then bail out.
    if ( context.group === undefined || context.group === null 
        || context.userMember === undefined // UserMember can be null for open groups.
        || context.groupMember === undefined || context.groupMember === null ) 
    {
        return false
    }

    // Site Moderators can view GroupMembers.  This is necessary for their
    // moderation duties.
    if ( context.canModerateSite === true ) {
        return true
    }

    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    // Group Moderators can always view GroupMembers.
    if ( context.canModerateGroup === true ) {
        return true
    }

    // Anyone can view content of open group.
    if ( context.group.type === 'open' ) {
        return true
    }

    if ( context.userMember !== null  ) {
        // If they are a confirmed member of the group, then they can view other confirmed members.
        if ( context.userMember.groupId === context.group.id && context.userMember.status === 'member' && context.groupMember.status === 'member' ) {
            return true 
        } 
    }

    // They can view their own member, if they haven't been banned.
    if ( context.group.id === context.groupMember.groupId && user.id === context.groupMember.userId && context.groupMember.status !== 'banned') {
        return true
    }

    return false 
}

const canCreateGroupMember = function(user, context) {
    if ( context.group === undefined || context.group === null 
        || context.userMember === undefined // userMember may be null, indicating that they aren't a member of the group yet
        || context.groupMember === undefined || context.groupMember === null ) 
    {
        return false
    }

    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    // For open groups
    if ( context.group.type === 'open' ) {
        return context.canModerateGroup === true || ( context.userMember === null && context.groupMember.userId === user.id)
    }
    // For private groups
    if ( context.group.type === 'private' ) {
        return context.canModerateGroup === true || (context.userMember === null && context.groupMember.userId === user.id)
    }
    // For Hidden groups
    if ( context.group.type === 'hidden' ) {
        return context.canModerateGroup === true
    }

    return false
}

const canUpdateGroupMember = function(user, context) {
    if ( context.groupMember === undefined || context.groupMember === null ) {
        return false
    }

    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    // Admins can promote members to moderator or admin
    // Moderators can ban members
    if ( context.canModerateGroup === true) {
        return true
    }

    // Users can update their own GroupMember in certain circumstances.
    if ( user.id === context.groupMember.userId ) {
        return true
    }

    return false
}

const canDeleteGroupMember = function(user, context) {
    if ( context.groupMember === undefined || context.groupMember === null ) {
        return false
    }

    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    // Moderators can delete members.
    if ( context.groupMember.role === 'member' && context.canModerateGroup === true ) {
        return true
    } 

    // Admins can delete moderators.
    if ( context.groupMember.role === 'moderator' && context.canAdminGroup === true) {
        return true
    }

    // Members can delete their own GroupMember
    if ( user.id === context.groupMember.userId ) {
        return true
    }

    return false
}

module.exports = {
    canQueryGroupMember: canQueryGroupMember,
    canViewGroupMember: canViewGroupMember,
    canCreateGroupMember: canCreateGroupMember,
    canUpdateGroupMember: canUpdateGroupMember,
    canDeleteGroupMember: canDeleteGroupMember
}
