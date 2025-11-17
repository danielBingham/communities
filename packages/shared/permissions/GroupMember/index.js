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
    if ( ! ('group' in context) || context.group === undefined || context.group === null ) {
        return false
    }
    // Site Moderators can view GroupMembers.  This is necessary for their
    // moderation duties.
    if ( context.canModerateSite === true ) {
        return true
    }

    // If they can moderate the group, they can always view the membership.
    if ( context.canModerateGroup === true ) {
        return true
    }

    // Always exclude banned members.
    if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null
        && context.userMember.userId === user.id && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' 
    ) {
        return false
    }

    // Anyone can view content of open group.
    if ( context.group.type === 'open' ) {
        return true
    }

    // For these group types, you can view the content if you are a member of
    // the parent group.
    if ( context.group.type === 'private-open' || context.group.type === 'hidden-open' ) {
        if ( 'parentMember' in context && context.parentMember !== undefined && context.parentMember !== null
            && context.parentMember.userId === user.id && context.parentMember.groupId === context.group.parentId
            && context.parentMember.status === 'member'
        ) {
            return true
        }
    }

    // Otherwise they must be a confirmed member of the group.
    if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null 
        && context.userMember.userId === user.id && context.userMember.groupId === context.group.id
        && context.userMember.status === 'member') 
    {
        return true 
    }

    return false 
}

const canViewGroupMember = function(user, context) {
    // If we don't have our context, then bail out.
    if ( ! ( 'group' in context) || context.group === undefined || context.group === null 
        || ! ( 'groupMember' in context) || context.groupMember === undefined || context.groupMember === null ) 
    {
        return false
    }

    // Site Moderators can view GroupMembers.  This is necessary for their
    // moderation duties.
    if ( context.canModerateSite === true ) {
        return true
    }

    // Group Moderators can always view GroupMembers.
    if ( context.canModerateGroup === true ) {
        return true
    }

    // Always exclude banned members.
    if ( context.userMember !== undefined && context.userMember !== null
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' )
    {
        return false
    }

    // Anyone can view the confirmed members of an open group.
    if ( context.group.type === 'open' && context.groupMember.status === 'member' ) {
        return true
    }

    // For `hidden-open` groups they can see confirmed members if they
    // are a member of the parent group.
    if ( context.group.type === 'hidden-open' ) {
        if ( 'parentMember' in context && context.parentMember !== undefined && context.parentMember !== null
            && context.parentMember.userId === user.id && context.parentMember.groupId === context.group.id
            && context.parentMember.status !== 'banned' 
            && context.groupMember.groupId === context.group.id && context.groupMember.status === 'member'
        ) {
            return true
        }
    }

    // If they are a confirmed member of the group, then they can view other confirmed members.
    if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null  
        && context.userMember.userId === user.id && context.userMember.groupId === context.group.id 
        && context.userMember.status === 'member' && context.groupMember.status === 'member' 
    ) {
        return true 
    }

    // They can view their own member, if they haven't been banned.
    if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null  
        && context.userMember.userId === user.id && context.userMember.groupId === context.group.id 
        && context.groupMember.userId === user.id && context.groupMember.groupId === context.group.id
        && context.userMember.status !== 'banned' && context.groupMember.status !== 'banned' 
    ) {
        return true 
    }

    return false 
}

const canCreateGroupMember = function(user, context) {
    if ( context.canAdminGroup ) {
        return true
    }

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
    if ( context.group.type === 'private' ||  context.group.type === 'private-open' ) { 
        return context.canModerateGroup === true || (context.userMember === null && context.groupMember.userId === user.id)
    }
    // For Hidden groups
    if ( context.group.type === 'hidden' ) {
        return context.canModerateGroup === true
    }

    if ( context.group.type === 'hidden-open' || context.group.type === 'hidden-private' ) {
        if ( context.canModerateGroup === true 
            || ( 'parentMember' in context && context.parentMember !== undefined && context.parentMember !== null
                && context.parentMember.userId === user.id && context.parentMember.groupId === context.group.parentId
                && context.parentMember.status === 'member' 
                && context.groupMember.userId === user.id && context.groupMember.groupId === context.group.id
            ) 
        ) {
            return true
        }
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

    // Moderators can manage members.
    if ( context.groupMember.role === 'member' && context.canModerateGroup === true ) {
        return true
    } 

    // Admins can manage moderators.
    if ( context.groupMember.role === 'moderator' && context.canAdminGroup === true) {
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
