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
        this.core

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



    }

    async canQueryFile(user, context) {
        return true
    }

    async canCreateFile(user, context) {
        return true
    }

    async canViewFile(user, context) {
        await this.ensureContext(user, context, [ 'file' ])

        // Users can always view their own files.
        if ( user.id === context.file.userId ) {
            return true
        }

        // Get the full usage information for this file.  This will tell us how
        // the file is used, which will tell us what permissions we need to
        // retrieve.
        const results = await this.core.database.query(`
            SELECT
                files.id, posts.id as post_id, groups.id as group_id, users.id as user_id
            FROM files
                LEFT OUTER JOIN posts ON files.id = posts.file_id
                LEFT OUTER JOIN groups ON files.id = groups.file_id
                LEFT OUTER JOIN users ON files.id = users.file_id
            WHERE files.id = $1
        `, [ context.file.id ])

        if ( results.rows.length <= 0 ) {
            return false
        }

        // We should only ever have a single row since we're searching by ID.
        if ( results.rows.length > 1 ) {
            this.core.logger.error(`Found more than one usage row for File(${context.file.id}).`)
            return false
        }

        const fileUsage = results.rows[0]

        // If it's a file on a post, they can view it if they can view the post.
        if ( fileUsage.post_id !== null ) {
            const canViewPost = await this.permissionService.can(user, 'view', 'Post', { postId: fileUsage.post_id })
            return canViewPost
        }

        // If it's a Group profile picture, they can view it if they can view the group.
        if ( fileUsage.group_id !== null ) {
            const canViewGroup = await this.permissionService.can(user, 'view', 'Group', { groupId: fileUsage.group_id })
            return canViewGroup
        }

        // If it's a user profile picture, they can view it if they can view the user.
        if ( fileUsage.user_id !== null ) {
            const canViewUser = await this.permissionService.can(user, 'view', 'User', { userId: fileUsage.user_id })
            return canViewUser
        }

        return false
    }

    async canUpdateFile(user, context) {
        await this.ensureContext(user, context, [ 'file' ])

        if ( user.id === context.file.userId ) {
            return true
        }

        return false
    }

    async canDeleteFile(user, context) {
        await this.ensureContext(user, context, [ 'file' ])

        if ( user.id === context.file.userId ) {
            return true
        }

        return false
    }
}
