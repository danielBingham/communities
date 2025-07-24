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

const canAdminGroup = function(user, context) {
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
