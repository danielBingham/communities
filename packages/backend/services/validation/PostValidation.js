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

const PermissionService = require ('../PermissionService')
const { util, validation } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class PostValidation {

    constructor(core, validationService) {
        this.core = core

        this.groupDAO = new GroupDAO(core)

        this.validationService = validationService
        this.permissionService = new PermissionService(core)
    }

    async validatePost(currentUser, post, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== post.id ) {
            throw new ServiceError('entity-mismatch', 
                `Existing Post(${existing.id}) does not match Post(${post.id}).`)
        }

        // Do basic validation the fields.
        const validationErrors = validation.Post.validate(post, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        if ( errors.length > 0 ) {
            return errors
        }


        // ================== Validate Relations =====================================
        // Validate that related objects exist and handle any conflicts among
        // relations.

        if ( util.objectHas(post, 'userId') && post.userId !== null) {
            const userIdResults = await this.core.database.query(`
                    SELECT id FROM users WHERE id = $1
                `, [ post.userId ])

            if ( userIdResults.rows.length <= 0 ) {
                errors.push({
                    type: 'userId:not-found',
                    log: `User(${post.userId}) not found.`,
                    message: `We couldn't find a user for Post.userId.`
                })
            }

            // May not post on behalf of another user.
            if ( post.userId !== currentUser.id ) {
                errors.push({
                    type: 'userId:not-authorized',
                    log: `User attempting to post for User(${post.userId}).  Not authorized.`,
                    message: `You are not allowed to post for another user.`
                })
            }
        }

        if ( util.objectHas(post, 'fileId') && post.fileId !== null ) {
            const fileResults = await this.core.database.query(`
                        SELECT id FROM files WHERE id = $1
                    `, [ post.fileId ])

            if ( fileResults.rows.length <= 0 ) {
                errors.push({
                    type: 'fileId:not-found',
                    log: `File(${post.fileId}) not found.`,
                    message: `We couldn't find File(${post.fileId}).`
                })
            }

            if ( util.objectHas(post, 'linkPreviewId') && post.linkPreviewId !== null ) {
                errors.push({
                    type: 'fileId:conflict',
                    log: `Cannot have both fileId and linkPreviewId.`,
                    message: `You cannot attach both a link and an image.`
                })
            }

            if ( util.objectHas(post, 'sharedPostId') && post.sharedPostId !== null ) {
                errors.push({
                    type: 'fileId:conflict',
                    log: `Cannot have both fileId and sharedPostId.`,
                    message: `You cannot attach both an image and a shared post.`
                })
            }
        }

        if ( util.objectHas(post, 'linkPreviewId') && post.linkPreviewId !== null ) {
            const linkPreviewIdResults = await this.core.database.query(`
                        SELECT id FROM link_previews WHERE id = $1
                    `, [ post.linkPreviewId ])

            if ( linkPreviewIdResults.rows.length <= 0 ) {
                errors.push({
                    type: 'linkPreviewId:not-found',
                    log: `LinkPreview(${post.linkPreviewId}) was not found.`,
                    message: `We couldn't find a LinkPreview for that id.`
                })
            }

            if ( util.objectHas(post, 'fileId') && post.fileId !== null ) {
                errors.push({
                    type: 'linkPreviewId:conflict',
                    log: `Cannot have both linkPreviewId and fileId set.`,
                    message: `You cannot attach both a link and an image.`
                })
            }

            if ( util.objectHas(post, 'sharedPostId') && post.sharedPostId !== null ) {
                errors.push({
                    type: 'linkPreviewId:conflict',
                    log: `Cannot have both linkPreviewId and sharedPostId.`,
                    message: `You cannot attach both a link and a shared post.`
                })
            }
        }

        if ( util.objectHas(post, 'sharedPostId') && post.sharedPostId !== null ) {
            const sharedPostIdResults = await this.core.database.query(`
                        SELECT id, visibility FROM posts WHERE id = $1
                    `, [ post.sharedPostId ])

            if ( sharedPostIdResults.rows.length <= 0 ) {
                errors.push({
                    type: 'sharedPostId:not-found',
                    log: `Post(${post.sharedPostId}) not found.`,
                    message: `We couldn't find the Post you wanted to share.`
                })
            } else if ( sharedPostIdResults.rows[0].visibility !== 'public' ) {
                errors.push({
                    type: 'sharedPostId:invalid',
                    log: `Attempting to share Post(${post.sharedPostId}) which is not public.`,
                    message: `You can only share public Posts.`
                })
            }

            if ( util.objectHas(post, 'fileId') && post.fileId !== null ) {
                errors.push({
                    type: 'sharedPostId:conflict',
                    log: `Cannot have both sharedPostId and fileId.`,
                    message: `You cannot attach both a shared post and an image.`
                })
            }

            if ( util.objectHas(post, 'linkPreviewId') && post.linkPreviewId !== null ) {
                errors.push({
                    type: 'sharedPostId:conflict',
                    log: `Cannot have both sharedPostId and linkPreviewId.`,
                    message: `You cannot attach both a shared post and a link.`
                })
            }
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // ================== Type Checks =====================================
        // Different types of posts have different constraints.  Group posts need
        // to have their visibility match the group type.

        // The visibility of posts in groups must match the visibility of the group.
        if ( util.objectHas(post, 'type') && post.type === 'group' ) {
            if ( ! util.objectHas(post, 'groupId') || post.groupId === null ) {
                errors.push({
                    type: 'groupId:missing',
                    log: 'Attempt to make a Group post without a groupId.',
                    message: `You can't post to a Group without including a groupId.`
                })
            } else {
                const group = await this.groupDAO.getGroupById(post.groupId)

                if ( group === null ) {
                    errors.push({
                        type: 'groupId:not-found',
                        log: `Attempt to post to a Group(${post.groupId}) that doesn't exist.`,
                        message: `You can't post to a group that doesn't exist.`
                    })
                } else {
                    if ( group.type === 'open' && post.visibility === 'private' ) {
                        errors.push({
                            type: 'visibility:invalid',
                            log: `Attempt to make a private Post to an Open Group.`,
                            message: `You can't make a private Post to an Open Group.`
                        })
                    }

                    if ( (group.type === 'private' || group.type === 'hidden') 
                        && post.visibility === 'public' ) 
                    {
                        errors.push({
                            type: 'visibility:invalid',
                            log: `Attempt to make a public Post to a private or hidden Group.`,
                            message: `You can't make a public Post to a private or hidden Group.`
                        })
                    }
                }
            }
        }

        if ( util.objectHas(post, 'type') &&  ( post.type === 'announcement' || post.type === 'info' ) ) {
            const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')

            if ( ! canAdminSite ) {
                errors.push({
                    type: 'not-authorized',
                    log: `Non-admin user attempting to make '${post.type}' post.`,
                    message: `You are not authorized to create '${post.type}' posts.`
                })
            }
        }

        return errors
    }
}
