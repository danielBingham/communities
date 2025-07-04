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

const canViewGroupMember = function(user, context) {

    // Site Moderators can view GroupMembers.  This is necessary for their
    // moderation duties.
    if ( context.canModerateSite === true ) {
        return true
    }

    if ( context.group === undefined || context.group === null ) {
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

const canCreateGroupMember = function(user, context) {
    if ( context.group === undefined || context.group === null ) {
        return false
    }

    if ( context.groupMember === undefined || context.groupMember === null ) {
        return false
    }

    // For open groups
    if ( context.group.type === 'open' ) {
        return context.canModerateGroup === true || ( context.userMember !== undefined && context.userMember === null && context.groupMember.userId === user.id)
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
    // Admins can promote members to moderator or admin
    // Moderators can ban members
    if ( context.canModerateGroup === true) {
        return true
    }

    if ( context.groupMember === undefined || context.groupMember === null ) {
        return false
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
    canViewGroupMember: canViewGroupMember,
    canCreateGroupMember: canCreateGroupMember,
    canUpdateGroupMember: canUpdateGroupMember,
    canDeleteGroupMember: canDeleteGroupMember
}
