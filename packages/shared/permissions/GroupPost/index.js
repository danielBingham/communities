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

const canViewGroupPost = function(user, context) {

    // If we don't have a group, then we can't very well tell if the user has
    // permission!
    if ( context.group === undefined || context.group === null ) {
        return false
    }

    // Site Moderators can view Group Posts.  This is necessary for their
    // moderation duties.
    if ( context.canModerateSite === true ) {
        return true
    }

    // If you can moderate the group, then you can always view the posts.
    if ( context.canModerateGroup === true ) {
        return true
    }

    // Banned users cannot see content.
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
            && context.parentMember.userId === user.id && context.parentMember.groupId === context.group.id
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

const canCreateGroupPost = function(user, context) {
    if ( ! ( 'group' in context) || context.group === undefined || context.group === null ) {
        return false
    }

    // Banned users cannot create posts.
    if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null 
        && context.userMember.userId === user.id && context.userMember.groupId === context.group.id
        && context.userMember.status === 'banned' 
    ) {
        return false
    }

    if ( context.group.postPermissions === 'anyone' ) {
        // Anyone may post to the group.
        return true
    } else if ( context.group.postPermissions === 'members' ) {
        // Confirmed members may post to the group.
        if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null 
            && context.userMember.userId === user.id && context.userMember.groupId === context.group.id
            && context.userMember.status === 'member') 
        {
            return true 
        } else {
            return false
        }
    } else if ( context.group.postPermissions === 'approval' ) {
        // Confirmed members may post to the group, however their posts will be
        // made 'pending' on the backend.
        if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null 
            && context.userMember.userId === user.id && context.userMember.groupId === context.group.id
            && context.userMember.status === 'member') 
        {
            return true 
        } else {
            return false
        }
    } else if ( context.group.postPermissions === 'restricted' ) {
        // Only admins and moderators may post to the group.
        if ( 'userMember' in context && context.userMember !== undefined && context.userMember !== null 
            && context.userMember.userId === user.id && context.userMember.groupId === context.group.id
            && context.userMember.status === 'member' && context.canModerateGroup === true ) 
        {
            return true 
        } else {
            return false
        }
    }

    return false 
}

module.exports = {
    canViewGroupPost: canViewGroupPost,
    canCreateGroupPost: canCreateGroupPost
}
