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
const util = require('../../util')

const canQueryPost = function(user, context) {
    // Users can always query for posts.
    return true
}

const canCreatePost = function(user, context) {
    if ( ! util.objectHas(context, 'post') || context.post === null ) {
        return false
    }

    // If the post is a Group post, then group permissions override post
    // permissions. 
    if ( context.post.groupId ) {
        return context.canCreateGroupPost === true
    }

    return true
}

const canViewPost = function(user, context) {
    if ( ! util.objectHas(context, 'post') || context.post === null ) {
        return false
    }

    // Site moderators can always view posts.
    if ( context.canModerateSite === true ) {
        return true
    }

    // If the post is a Group post, then group permissions override post
    // permissions. 
    if ( context.post.groupId ) {
        return context.canViewGroupPost === true 
    }

    // Users can view their own posts.
    if ( context.post.userId === user.id ) {
        return true
    } 
    // Anyone can view public posts.
    else if ( context.post.visibility === 'public' ) {
        return true
    }

    if ( util.objectHas(context, 'userRelationship') ) {
        if ( context.userRelationship !== null && context.userRelationship.status === 'confirmed') {
            return true
        }
    }

    return false 
}

const canUpdatePost = function(user, context) {
    if ( ! util.objectHas(context, 'post') || context.post === null ) {
        return false
    }

    if ( context.post.userId === user.id ) {
        return true
    }

    return false
}

const canDeletePost = function(user, context) {
    if ( ! util.objectHas(context, 'post') || context.post === null ) {
        return false
    }

    // Users can always delete their own posts.
    if ( context.post.userId === user.id ) {
        return true
    }

    return false
}


module.exports = {
    canQueryPost: canQueryPost,
    canCreatePost: canCreatePost,
    canViewPost: canViewPost,
    canUpdatePost: canUpdatePost,
    canDeletePost: canDeletePost
}
