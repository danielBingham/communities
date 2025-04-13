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

const ServiceError = require('../errors/ServiceError')

const GroupDAO = require('../daos/GroupDAO')
const PostDAO = require('../daos/PostDAO')

module.exports = class ValidationService {
    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.postDAO = new PostDAO(core)
    }

    has(entity, field) {
        return field in entity && entity[field] !== undefined && entity[field] !== null
    }

    async validatePost(post, existing) {
        const errors = []

        // Some checks we only perform on post creation and some we only
        // perform when editing a post.
        if ( ! existing ) {

            // Check for the required fields.
            if ( ! this.has(post, 'type') || ! this.has(post, 'userId') || ! this.has(post, 'visibility')) {
                errors.push({
                    type: `missing-field`,
                    log: `Post missing required field.`,
                    message: `You're missing one of the required fields: type, userId, or visibility.`
                })
            }

            // Make sure the post's type is valid.
            if ( this.has(post, 'type') && post.type !== 'group' && post.type !== 'feed' ) {
                errors.push({
                    type: 'invalid-type',
                    log: `Attempt to create a Post with invalid type '${post.type}'.`,
                    message: `The type '${post.type}' is not a valid Post type.`
                })
            }
        } else {

            // Can't edit the type.
            if ( this.has(post, 'type') && post.type !== existing.type ) {
                errors.push({
                    type: 'disallowed-field',
                    log: `Attempt to update the 'type' field of a post.`,
                    message: `You can't update the 'type' of a post.`
                })
            }

            // Can't edit the userId.
            if ( this.has(post, 'userId') && post.userId !== existing.userId) {
                errors.push({
                    type: 'disallowed-field',
                    log: `Attempt to update the 'userId' field of a post.`,
                    message: `You can't update the 'userId' of a post.`
                })
            }

            // Can't edit the groupId.
            if ( this.has(post, 'groupId') && post.groupId !== existing.groupId ) {
                errors.push({
                    type: 'disallowed-field',
                    log: `Attempt to update the 'groupId' field of a post.`,
                    message: `You can't update the 'groupId' of a post.`
                })
            }
        }

        // Post content is limited to 10,000 characters in length.
        if ( this.has(post, 'content') && post.content.length > 10000 ) {
            errors.push({
                type: `too-long`,
                log: `Post too long.`,
                message: `Your post was too long.  Please keep posts to 10,000 characters or les.`
            })
        }

        // Posts can only have a single attachment.
        if ( 
            (this.has(post, 'fileId') && (this.has(post, 'linkPreviewId') || this.has(post, 'sharedPostId')))
            || (this.has(post, 'linkPreviewId') && (this.has(post, 'fileId') || this.has(post, 'sharedPostId')))
            || (this.has(post, 'sharedPostId') && (this.has(post, 'fileId') || this.has(post, 'linkPreviewId')))
        ) {
            errors.push({
                type: 'too-many-attachments',
                log: 'Too many attachments.',
                message: `Your post can only have one attachment: file, link, or share.`
            })
        }

        // TODO Validate that the attachments exist.

        // The visibility of posts in groups must match the visibility of the group.
        if ( this.has(post, 'type') && post.type === 'group' ) {
            if ( ! this.has(post, 'groupId') ) {
                errors.push({
                    type: 'missing-field',
                    log: 'Attempt to make a Group post without a groupId.',
                    message: `You can't post to a Group without including a groupId.`
                })
            }

            const group = this.groupDAO.getGroupById(post.groupId)

            if ( group === null ) {
                errors.push({
                    type: 'no-group',
                    log: `Attempt to post to a Group(${post.groupId}) that doesn't exist.`,
                    message: `You can't post to a group that doesn't exist.`
                })
            }

            if ( group.type === 'open' && post.visibility === 'private' ) {
                errors.push({
                    type: 'wrong-visibility',
                    log: `Attempt to make a private Post to an Open Group.`,
                    message: `You can't make a private Post to an Open Group.`
                })
            }

            if ( (group.type === 'private' || group.type === 'hidden') && post.visibility === 'public' ) {
                errors.push({
                    type: 'wrong-visibility',
                    log: `Attempt to make a public Post to a private or hidden Group.`,
                    message: `You can't make a public Post to a private or hidden Group.`
                })
            }
        }

        // Users aren't allowed to update the activity.
        if ( this.has(post, 'activity') ) {
            errors.push({
                type: 'disallowed-field',
                log: `Attempt to set a Post's activity.`,
                message: `You aren't allowed to set the Post's activity.`
            })
        }

        return errors
    }


}
