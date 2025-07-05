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

const GroupDAO = require('../../daos/GroupDAO')
const GroupMemberDAO = require('../../daos/GroupMemberDAO')
const PostDAO = require('../../daos/PostDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util, permissions } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class PostPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.postDAO = new PostDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        // If we don't have the post, then attempt to load it.
        if ( ( required?.includes('post') || optional?.includes('post') ) 
            && ( ! util.objectHas(context, 'post') || context.post === null )) 
        {

            // If it is in context, and null, then we don't want to load it.
            // It's already been set to null.
            if ( context.post !== null ) {
                if ( util.objectHas(context, 'postId') ) {
                    context.post = await this.postDAO.getPostById(context.postId)
                }  else {
                    context.post = null
                }
            }

            if ( required?.includes('post') 
                && (! util.objectHas(context, 'post') || context.post === null ) ) 
            {
                throw new ServiceError('missing-context', `'post' missing from context.`)
            }

        }


        if ( (required?.includes('userRelationship') || optional?.includes('userRelationship'))
            && ( ! util.objectHas(context, 'userRelationship') || context.userRelationship === null ) )
        {
            if ( context.userRelationship !== null ) {
                if ( util.objectHas(context, 'post') && context.post !== null ) {
                    context.userRelationship = await this.userRelationshipDAO.getUserRelationshipByUserAndRelation(user.id, context.post.userId)
                } else {
                    context.userRelationship = null
                }
            }

            if ( required?.includes('userRelationship')
                && ( ! util.objectHas(context, 'userRelationship') || context.userRelationship === null ))
            {
                throw new ServiceError('missing-context', `'userRelationship' missing from context.`)
            }
        }
        
        // ===== Ensure all elements of Group context match. ======

        let postId = null
        if ( util.objectHas(context, 'postId') && context.postId !== null ) {
            postId = context.postId
        }

        if ( util.objectHas(context, 'post') && context.post !== null ) {
            if ( postId === null ) {
                postId = context.post.id
            } else if ( context.post.id !== postId) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Posts.`)
            }
        }

        let userId = null
        if ( util.objectHas(context, 'post') && context.post !== null ) {
            userId = context.post.userId
        }

        if ( util.objectHas(context, 'userRelationship') && context.userRelationship !== null ) {
            if (  ! ( user.id === context.userRelationship.userId && userId === context.userRelationship.relationId )
                && ! ( user.id === context.userRelationship.relationId && userId === context.userRelationship.userId))
            {
                throw new ServiceError('context-mismatch', `Context includes elements from a different UserRelationship.`)
            }
        }
    }

    async canQueryPost(user, context) {
        return permissions.Post.canQueryPost(user, context) 
    }

    async canCreatePost(user, context) {
        await this.ensureContext(user, context, [ 'post' ])

        // If the post is a Group post, then group permissions override post
        // permissions. 
        if ( context.post.groupId ) {
            context.canCreateGroupPost = await this.permissionService.can(user, 'create', 'GroupPost', context)
        }

        return permissions.Post.canCreatePost(user, context)
    }

    async canViewPost(user, context) {
        await this.ensureContext(user, context, [ 'post' ], [ 'userRelationship' ])

        context.canModerateSite = await this.permissionService.can(user, 'moderate', 'Site')

        if ( context.post.groupId ) {
            context.canViewGroupPost = await this.permissionService.can(user, 'view', 'GroupPost', context)
        }

        return permissions.Post.canViewPost(user, context)
    }

    async canUpdatePost(user, context) {
        await this.ensureContext(user, context, [ 'post' ] )

        return permissions.Post.canUpdatePost(user, context)
    }

    async canDeletePost(user, context) {
        await this.ensureContext(user, context, [ 'post' ] )

        return permissions.Post.canDeletePost(user, context)
    }
}
