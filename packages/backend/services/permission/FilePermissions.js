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

const FileDAO = require('../../daos/FileDAO')
const GroupDAO = require('../../daos/GroupDAO')
const GroupMemberDAO = require('../../daos/GroupMemberDAO')
const PostDAO = require('../../daos/PostDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util, permissions } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class FilePermissions {

    constructor(core, permissionService) {
        this.core = core

        this.permissionService = permissionService

        this.fileDAO = new FileDAO(core)
        this.postDAO = new PostDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        if ( ( required?.includes('file') || optional?.includes('file') )
            && ( ! util.objectHas(context, 'file') || context.file === null )
        ) {

            // If it's already set to null, then we don't want to load it.
            // It's absent.
            if ( context.file !== null ) {
                if ( util.objectHas(context, 'fileId') ) {
                    context.file = await this.fileDAO.getFileById(context.fileId)
                } else {
                    context.file = null
                }
            }

            if ( required?.includes('file')
                && ( ! util.objectHas(context, 'file') || context.file === null )
            ) {
                throw new ServiceError('missing-context', `'file' missing from context.`)
            }
        }

        if ( ( required?.includes('usage') || optional?.includes('usage') )
            && ( ! util.objectHas(context, 'usage') || context.usage === null )
        ) {

            if ( context.usage !== null ) {
                // Get the full usage information for this file.  This will tell us how
                // the file is used, which will tell us what permissions we need to
                // retrieve.
                const results = await this.core.database.query(`
                    SELECT
                        post_files.post_id as "postId",
                        groups.id as "groupId",
                        users.id as "userId",
                        link_previews.id as "linkPreviewId"
                    FROM files
                        LEFT OUTER JOIN post_files ON files.id = post_files.file_id
                        LEFT OUTER JOIN groups ON files.id = groups.file_id
                        LEFT OUTER JOIN users ON files.id = users.file_id
                        LEFT OUTER JOIN link_previews ON files.id = link_previews.file_id
                    WHERE files.id = $1
                `, [ context.file.id ])

                if ( results.rows.length <= 0 ) {
                   context.usage = null
                }

                // We should only ever have a single row since we're searching by ID.
                if ( results.rows.length > 1 ) {
                    this.core.logger.error(`Found more than one usage row for File(${context.file.id}).`)
                    context.usage = null
                }

                context.usage = results.rows[0]
            }

            if ( required?.includes('usage')
                && ( ! util.objectHas(context, 'usage') || context.usage === null )
            ) {
                throw new ServiceError('missing-context', `'usage' missing from context.`)
            }
        }
    }

    async canQueryFile(user, context) {
        return true
    }

    async canCreateFile(user, context) {
        // Can create a file that doesn't exist.
        if ( ! util.objectHas(context, 'file') || context.file === null ) {
            return false
        }

        // Users may only create files for themselves, not for another user.
        if ( context.file.userId === user.id ) {
            return true
        }

        return false
    }

    async canViewFile(user, context) {
        await this.ensureContext(user, context, [ 'file', 'usage' ])

        // Users can always view their own files.
        if ( user.id === context.file.userId ) {
            return true
        }

        // Site moderators can always view files.
        const canModerateSite = await this.permissionService.can(user, 'moderate', 'Site')
        if ( canModerateSite === true ) {
            return true
        }

        if ( context.usage === null ) {
            return false
        }

        // Link previews are shared, so anyone may view them.
        if ( context.usage.linkPreviewId !== null ) {
            return true
        }

        // If it's a file on a post, they can view it if they can view the post.
        if ( context.usage.postId !== null ) {
            const canViewPost = await this.permissionService.can(user, 'view', 'Post', { postId: context.usage.postId })
            if ( canViewPost === true ) {
                return true
            }
        }

        // If it's a Group profile picture, they can view it if they can view the group.
        if ( context.usage.groupId !== null ) {
            const canViewGroup = await this.permissionService.can(user, 'view', 'Group', { groupId: context.usage.groupId })
            if ( canViewGroup === true ) {
                return true
            }
        }

        // If it's a user profile picture, they can view it if they can view the user.
        if ( context.usage.userId !== null ) {
            const canViewUser = await this.permissionService.can(user, 'view', 'User', { userId: context.usage.userId })
            if ( canViewUser === true ) {
                return true
            }
        }

        return false
    }

    // For files, update covers uploading the file itself as well as cropping
    // it. In the future it will cover things like alt-text.
    async canUpdateFile(user, context) {
        await this.ensureContext(user, context, [ 'file', 'usage' ])

        if ( user.id === context.file.userId ) {
            return true
        }

        // It's a group profile image.  They can update it if they can admin
        // the group.
        if ( context.usage !== null && context.usage.groupId !== null ) {
            const canAdminGroup = await this.permissionService.can(user, 'admin', 'Group', { groupId: context.usage.groupId })
            if ( canAdminGroup === true ) {
                return true
            }
        }

        return false
    }

    async canDeleteFile(user, context) {
        await this.ensureContext(user, context, [ 'file', 'usage' ])

        if ( user.id === context.file.userId ) {
            return true
        }

        // Site moderators can always delete files.
        const canModerateSite = await this.permissionService.can(user, 'moderate', 'Site')
        if ( canModerateSite === true ) {
            return true
        }

        // It's a group profile image.  They can delete it if they can admin
        // the group.
        if ( context.usage !== null && context.usage.groupId !== null ) {
            const canAdminGroup = await this.permissionService.can(user, 'admin', 'Group', { groupId: context.usage.groupId })
            if ( canAdminGroup === true ) {
                return true
            }
        }

        return false
    }
}
