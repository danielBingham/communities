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
const PostSubscriptionDAO = require('../../daos/PostSubscriptionDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class PostSubscriptionPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.postDAO = new PostDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        // PostSubscription is the root context, so we need to check and retrieve it first.
        if ( (required?.includes('postSubscription') || optional?.includes('postSubscription'))
            && ( ! util.objectHas(context, 'postSubscription') || context.postSubscription === null))
        {
            if ( context.postSubscription !== null ) {
                if ( util.objectHas(context, 'postId') && context.postId !== null 
                    && util.objectHas(context, 'userId') && context.userId !== null)
                {
                    context.postSubscription = await this.postSubscriptionDAO.getPostSubscriptionByPostAndUser(context.postId, context.userId)
                } else if ( util.objectHas(context, 'postSubscriptionId') && context.postSubscriptionId !== null ) {
                    context.postSubscription = await this.postSubscriptionDAO.getPostSubscriptionById(context.postSubscriptionId)
                } else {
                    context.postSubscription = null
                }
            }

            if ( required?.includes('postSubscription') && context.postSubscription === null ) {
                throw new ServiceError('missing-context', `'postSubscription' missing from context.`)
            }
        }

        if ( (required?.includes('post') || optional?.includes('post'))
            && ( ! util.objectHas(context, 'post') || context.post === null ))
        {
            if ( context.post !== null ) {
                if ( util.objectHas(context, 'postId') && context.postId !== null) {
                    context.post = await this.postDAO.getPostById(context.postId)
                } else if ( util.objectHas(context, 'postSubscription') && context.postSubscription !== null
                    && util.objectHas(context.postSubscription, 'postId') && context.postSubscription.postId !== null )
                {
                    context.post = await this.postDAO.getPostById(context.postSubscription.postId)
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

        if ( util.objectHas(context, 'postSubscription') && context.postSubscription !== null ) {
            if ( postId === null ) {
                postId = context.postSubscription.postId
            } else if (postId !== context.postSubscription.postId ) {
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

    async canViewPostSubscription(user, context) {
        await this.ensureContext(user, context, [ 'postSubscription' ])
        
        // We're not going to test post visibility.
        if ( context.postSubscription.userId === user.id ) {
            return true
        }

        return false
    }

    async canCreatePostSubscription(user, context) {
        // We're not going to test post visibility, but if you can see the
        // post, you can create a subscription (for now).
        return true
    }

    async canUpdatePostSubscription(user, context) {
        await this.ensureContext(user, context, [ 'postSubscription' ])

        // Users may only update their own subscriptions.
        if ( context.postSubscription.userId === user.id ) {
            return true
        }

        return false
    }

    async canDeletePostSubscription(user, context) {
        await this.ensureContext(user, context, [ 'postSubscription' ])

        // Users may only delete their own subscriptions.
        if ( context.postSubscription.userId === user.id ) {
            return true
        }

        return false
    }
}
