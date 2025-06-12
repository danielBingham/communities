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
const PostCommentDAO = require('../../daos/PostCommentDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupMemberPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        // PostComment is the root context, so we need to check and retrieve it first.
        if ( (required?.includes('postComment') || optional?.includes('postComment'))
            && ( ! util.objectHas(context, 'postComment') || context.postComment === null))
        {
            if ( context.postComment !== null ) {
                if ( util.objectHas(context, 'postCommentId') && context.postCommentId !== null ) {
                    context.postComment = await this.postCommentDAO.getPostCommentById(context.postCommentId)
                } else {
                    context.postComment = null
                }
            }

            if ( required?.includes('postComment') && context.postComment === null ) {
                throw new ServiceError('missing-context', `'postComment' missing from context.`)
            }
        }

        if ( (required?.includes('post') || optional?.includes('post'))
            && ( ! util.objectHas(context, 'post') || context.post === null ))
        {
            if ( context.post !== null ) {
                if ( util.objectHas(context, 'postId') && context.postId !== null) {
                    context.post = await this.postDAO.getPostById(context.postId)
                } else if ( util.objectHas(context, 'postComment') && context.postComment !== null
                    && util.objectHas(context.postComment, 'postId') && context.postComment.postId !== null )
                {
                    context.post = await this.postDAO.getPostById(context.postComment.postId)
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

        if ( util.objectHas(context, 'postComment') && context.postComment !== null ) {
            if ( postId === null ) {
                postId = context.postComment.postId
            } else if (postId !== context.postComment.postId ) {
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

    async canViewPostComment(user, context) {

        // We're not going to test post visibility, but if you can see the
        // post, you can view a comment (for now).
        return true
    }

    async canCreatePostComment(user, context) {

        // We're not going to test post visibility, but if you can see the
        // post, you can create a comment (for now).
        return true
    }

    async canUpdatePostComment(user, context) {
        await this.ensureContext(user, context, [ 'postComment' ])

        // Users may only update their own comments.
        if ( context.postComment.userId === user.id ) {
            return true
        }

        return false
    }

    async canDeletePostComment(user, context) {
        // We need to ensure `post` here because canModerateGroup will need it.
        await this.ensureContext(user, context, [ 'postComment', 'post' ])

        // Users can always delete their own comments.
        if ( context.postComment.userId === user.id ) {
            return true
        }

        // If this is a PostComment on a Post in a Group, then group moderators can delete it.
        if ( context.post.groupId !== undefined && context.post.groupId !== null ) {
            const canModerateGroup = await this.permissionService.can(user, 'moderate', 'Group', context)
            // Group moderators can also delete comments.
            if ( canModerateGroup ) {
                return true
            }
        }

        return false
    }
}
