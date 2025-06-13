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

const PostDAO = require('../../daos/PostDAO')
const PostReactionDAO = require('../../daos/PostReactionDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupMemberPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.postDAO = new PostDAO(core)
        this.postReactionDAO = new PostReactionDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        // PostReaction is the root context, so we need to check and retrieve it first.
        if ( (required?.includes('postReaction') || optional?.includes('postReaction'))
            && ( ! util.objectHas(context, 'postReaction') || context.postReaction === null))
        {
            if ( context.postReaction !== null ) {
                if ( util.objectHas(context, 'postId') && context.postId !== null 
                    && util.objectHas(context, 'userId') && context.userId !== null)
                {
                    context.postReaction = await this.postReactionDAO.getPostReactionByPostAndUser(context.postId, context.userId)
                } else if ( util.objectHas(context, 'postReactionId') && context.postReactionId !== null ) {
                    context.postReaction = await this.postReactionDAO.getPostReactionById(context.postReactionId)
                } else {
                    context.postReaction = null
                }
            }

            if ( required?.includes('postReaction') && context.postReaction === null ) {
                throw new ServiceError('missing-context', `'postReaction' missing from context.`)
            }
        }

        if ( (required?.includes('post') || optional?.includes('post'))
            && ( ! util.objectHas(context, 'post') || context.post === null ))
        {
            if ( context.post !== null ) {
                if ( util.objectHas(context, 'postId') && context.postId !== null) {
                    context.post = await this.postDAO.getPostById(context.postId)
                } else if ( util.objectHas(context, 'postReaction') && context.postReaction !== null
                    && util.objectHas(context.postReaction, 'postId') && context.postReaction.postId !== null )
                {
                    context.post = await this.postDAO.getPostById(context.postReaction.postId)
                } else {
                    // We weren't able to retrieve the post.  Set it to null to
                    // trigger the missing context error.
                    context.post = null
                }
            }

            if ( required?.includes('post') && context.post === null ) {
                throw new ServiceError('missing-context', `'post' missing from context.`)
            }
        }

        let postId = null
        if ( util.objectHas(context, 'postId') && context.postId !== null ) {
            postId = context.postId
        }

        if ( util.objectHas(context, 'postReaction') && context.postReaction !== null ) {
            if ( postId === null ) {
                postId = context.postReaction.postId
            } else if (postId !== context.postReaction.postId ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Posts.`)
            }
        }

        if ( util.objectHas(context, 'post') && context.post !== null ) {
            if ( postId === null ) {
                postId = context.post.id
            } else if ( postId !== context.post.id ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Posts.`)
            }
        }
    }

    async canViewPostReaction(user, context) {
        // We're not going to test post visibility, but if you can see the
        // post, you can view a reaction (for now).
        return true
    }

    async canCreatePostReaction(user, context) {
        // We're not going to test post visibility, but if you can see the
        // post, you can create a reaction (for now).
        return true
    }

    async canUpdatePostReaction(user, context) {
        await this.ensureContext(user, context, [ 'postReaction' ])

        // Users may only update their own reactions.
        if ( context.postReaction.userId === user.id ) {
            return true
        }

        return false
    }

    async canDeletePostReaction(user, context) {
        await this.ensureContext(user, context, [ 'postReaction' ])

        // Users may only delete their own reactions.
        if ( context.postReaction.userId === user.id ) {
            return true
        }

        return false
    }
}
