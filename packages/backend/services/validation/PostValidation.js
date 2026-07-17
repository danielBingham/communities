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
const FileService = require('../FileService')
const { util, validation } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class PostValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService

        this.groupDAO = new GroupDAO(core)

        this.fileService = new FileService(core)
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

        if ( util.objectHas(post, 'groupId') && post.groupId !== null ) {
            const groupResults = await this.core.database.query(`
                SELECT id FROM groups WHERE id = $1
            `, [ post.groupId ])

            if ( groupResults.rows.length <= 0 ) {
                errors.push({
                    type: 'groupId:not-found',
                    log: `User attempting to post to Group(${post.groupId}) which wasn't found.`,
                    message: `That group doesn't exist.`
                })
            }
        }

        if ( util.objectHas(post, 'files') && post.files !== null && post.files.length > 0 ) {
            if ( ! Array.isArray(post.files) ) {
                errors.push({
                    type: 'files:invalid',
                    log: `'files' must be an array of UUIDs.`,
                    message: `Files must be an array of UUIDs.`
                })

            } else {
                const fileResults = await this.core.database.query(`
                            SELECT id, user_id FROM files WHERE id = ANY($1::uuid[])
                        `, [ post.files ])

                if ( fileResults.rows.length !== post.files.length ) {
                    errors.push({
                        type: 'files:not-found',
                        log: `We couldn't find all of the files in Post.files.`,
                        message: `Some of the files submitted were missing.`
                    })
                }
                // We only want to check for ownership and usage if we know all
                // the files exist.
                else {

                    // Ensure the user owns the files they are attaching.
                    const notOwned = fileResults.rows.filter((f) => f.user_id !== currentUser.id)
                    if ( notOwned.length > 0 ) {
                        errors.push({
                            type: 'files:not-authorized',
                            log: `User attempting to attach files they do not own to their post.`,
                            message: `You may only attach files you have uploaded.`
                        })
                    }

                    // We only want to check usage if we know the user owns all
                    // the files.
                    else {

                        // The usage case is complicated. If this is an edit,
                        // some of the files may be in use, but they must be in
                        // use *on this post*.  We need to check each fileId in
                        // the `files` array against its usage. It needs to
                        // either not be in use or in use by this post already.

                        const usage = await this.fileService.getUsageByFileIds(post.files)
                        for( const fileId of post.files ) {
                            // An unused file always passes.
                            if ( ! ( fileId in usage) ) {
                                continue
                            }

                            // An in use file for a new post always fails.
                            if ( fileId in usage && ( existing === null || existing === undefined) ) {
                                errors.push({
                                    type: 'files:conflict',
                                    log: `User attempting to attach file to post, but file is in use.`,
                                    message: `You may not attach files that are already in use.`
                                })
                                continue
                            }

                            // A file in use by the existing post passes.
                            if ( fileId in usage && existing.id === usage[fileId].postId
                                && usage[fileId].userId === null
                                && usage[fileId].groupId === null
                                && usage[fileId].linkPreviewId === null
                            ) {
                                continue
                            }
                            // Any other usage fails.
                            else {
                                errors.push({
                                    type: 'files:conflict',
                                    log: `User attempting to attach file to post, but file is in use.`,
                                    message: `You may not attach files that are already in use.`
                                })
                            }
                        }
                    }
                }

                if ( util.objectHas(post, 'linkPreviewId') && post.linkPreviewId !== null ) {
                    errors.push({
                        type: 'files:conflict',
                        log: `Cannot have both fileId and linkPreviewId.`,
                        message: `You cannot attach both a link and an image.`
                    })
                }

                if ( util.objectHas(post, 'sharedPostId') && post.sharedPostId !== null ) {
                    errors.push({
                        type: 'files:conflict',
                        log: `Cannot have both fileId and sharedPostId.`,
                        message: `You cannot attach both an image and a shared post.`
                    })
                }
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

            if ( util.objectHas(post, 'files') && post.files !== null && post.files.length > 0 ) {
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

            if ( util.objectHas(post, 'files') && post.files !== null && post.files.length > 0 ) {
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
        if ( util.objectHas(post, 'visibility') || util.objectHas(post, 'type') ) {
            let visibility = null
            let type = null
            // This is an edit.
            if ( existing ) {
                visibility = post.visibility ?? existing.visibility
                type = existing.type // Type cannot be updated.
            }
            // This is a creation.
            else {
                visibility = post.visibility
                type = post.type
            }

            if ( visibility === null || type === null ) {
                errors.push({
                    type: 'invalid',
                    log: `Post submitted without type or visibility (in existing or submission).  Need both to validate.`,
                    message: `You must include both visibility and type.`
                })
            }

            if ( type === 'feed' ) {
                if ( visibility !== 'public' && visibility !== 'private' ) {
                    errors.push({
                        type: 'invalid',
                        log: `Post submitted with invalid visiblity.`,
                        message: `Visibility is invalid.  Options are 'public' or 'private.`
                    })
                }
            }
            else if ( type === 'group' ) {
                let groupId = null
                if ( existing ) {
                    groupId = existing.groupId
                } else {
                    groupId = post.groupId
                }

                // For a "group" type post, there has to be a groupId.
                if ( groupId === undefined || groupId === null ) {
                    errors.push({
                        type: 'groupId:missing',
                        log: `Group post missing groupId`,
                        message: `Group posts must include their groupId.`
                    })
                }
                // The groupId may not be editted.
                else if ( existing && groupId !== existing.groupId ) {
                    errors.push({
                        type: 'invalid',
                        log: `Post groupId may not be updated.`,
                        message: `You may not update the Posts's groupId.`
                    })
                } else {

                    const group = await this.groupDAO.getGroupById(groupId)
                    if ( group === null ) {
                        errors.push({
                            type: 'groupId:not-found',
                            log: `Attempt to post to a Group(${post.groupId}) that doesn't exist.`,
                            message: `You can't post to a group that doesn't exist.`
                        })
                    }

                    if ( group.type === 'open' ) {
                        if ( visibility !== 'public' ) {
                            errors.push({
                                type: 'visibility:invalid',
                                log: `Posts to public groups must be public.`,
                                message: `Posts to public groups must be public.`
                            })
                        }
                    } else if ( group.type === 'private' ) {
                        if ( visibility !== 'private' ) {
                            errors.push({
                                type: 'visibility:invalid',
                                log: `Posts to private groups must be private.`,
                                message: `Posts to private groups must be private.`
                            })

                        }
                    } else if ( group.type === 'hidden' ) {
                        if ( visibility !== 'private' ) {
                            errors.push({
                                type: 'visibility:invalid',
                                log: `Posts to hidden groups must be private.`,
                                message: `Posts to hidden groups must be private.`
                            })
                        }
                    } else if ( group.type === 'private-open' ) {
                        if ( visibility !== 'private' ) {
                            errors.push({
                                type: 'visibility:invalid',
                                log: `Posts to private-open groups must be private.`,
                                message: `Posts to private-open groups must be private.`
                            })
                        }
                    } else if ( group.type === 'hidden-open' ) {
                        if ( visibility !== 'private' ) {
                            errors.push({
                                type: 'visibility:invalid',
                                log: `Posts to hidden-open groups must be private.`,
                                message: `Posts to hidden-open groups must be private.`
                            })
                        }
                    } else if ( group.type === 'hidden-private' ) {
                        if ( visibility !== 'private' ) {
                            errors.push({
                                type: 'visibility:invalid',
                                log: `Posts to hidden-private groups must be private.`,
                                message: `Posts to hidden-private groups must be private.`
                            })
                        }
                    } else {
                        throw new ServiceError('unhandled-group-type',
                            `Encountered a group with an unhandled type.`)
                    }
                }
            }
            else if ( type === 'announcement' ) {
                if ( visibility !== 'public' ) {
                    errors.push({
                        type: 'visibility:invalid',
                        log: `Announcement posts must be public.`,
                        message: `Announcement posts must be public.`
                    })
                }
            }
            else if ( type === 'info' ) {
                if ( visibility !== 'public' ) {
                    errors.push({
                        type: 'visibility:invalid',
                        log: `Info posts must be public.`,
                        message: `Info posts must be public.`
                    })
                }
            }
            else {
                throw new ServiceError(`invalid-type`,
                    `Invalid type reached consistency validation.`)
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
