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

const GroupDAO = require('../daos/GroupDAO')
const GroupMemberDAO = require('../daos/GroupMemberDAO')
const PostDAO = require('../daos/PostDAO')
const UserRelationshipDAO = require('../daos/UserRelationshipDAO')

const FilePermissions = require('./permission/FilePermissions')
const GroupPermissions = require('./permission/GroupPermissions')
const GroupMemberPermissions = require('./permission/GroupMemberPermissions')
const GroupPostPermissions = require('./permission/GroupPostPermissions')
const NotificationPermissions = require('./permission/NotificationPermissions')
const PostPermissions = require('./permission/PostPermissions')
const PostCommentPermissions = require('./permission/PostCommentPermissions')
const PostReactionPermissions = require('./permission/PostReactionPermissions')
const PostSubscriptionPermissions = require('./permission/PostSubscriptionPermissions')
const UserPermissions = require('./permission/UserPermissions')
const UserRelationshipPermissions = require('./permission/UserRelationshipPermissions')

const ServiceError = require('../errors/ServiceError')

/**
 *
 */
module.exports = class PermissionService {

    static ACTIONS = {
        QUERY: 'query',
        CREATE: 'create',
        VIEW: 'view',
        UPDATE: 'update',
        DELETE: 'delete',
        MODERATE: 'moderate',
        ADMIN: 'admin',
        SUDO: 'sudo'
    }

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.file = new FilePermissions(core, this)
        this.group = new GroupPermissions(core, this)
        this.groupMember = new GroupMemberPermissions(core, this)
        this.groupPost = new GroupPostPermissions(core, this)
        this.notification = new NotificationPermissions(core, this)
        this.post = new PostPermissions(core, this)
        this.postComment = new PostCommentPermissions(core, this)
        this.postReaction = new PostReactionPermissions(core, this)
        this.postSubscription = new PostSubscriptionPermissions(core, this)
        this.user = new UserPermissions(core, this)
        this.userRelationship = new UserRelationshipPermissions(core, this)
    }

    /**
     * Can `user` perform `action` on `entity` identified by `context`.
     *
     * Will lazy load any missing context it needs, provided it has the minimal
     * amount of information to load it.  If it is provided the context, it
     * won't load it.  For example, when checking group permissions, if context
     * has a 'group' set on it, it will use that.  Otherwise, it will look for
     * a 'groupId' on the context and use that to load the group. If it can't
     * find one, it will look for a 'post' and use the post's groupId.
     *
     * @returns {Promise<boolean>} True if the `user` can perform `action` on `entity`
     * identified by `context`, false otherwise.
     */
    async can(user, action, entity, context) {
        // Unauthenticated users are not allowed access.
        if ( ! user ) {
            return false
        }

        if ( user.status === null ) {
            throw new ServiceError('missing-context',
                `User.status requried to properly assess permissions.`)
        }

        // Banned users shouldn't be able to log in.  But if they somehow do
        // manage to bypass that protection, we want to prevent them from
        // doing... well, anything.
        if ( user.status === 'banned' ) {
            return false
        }

        // Similarly, if a user is not 'confirmed', then they are not allowed
        // to do any of the actions listed below.
        if ( user.status !== 'confirmed' ) {
            return false
        }

        if ( entity === 'File' ) {
            if ( action === PermissionService.ACTIONS.QUERY ) {
                return await this.file.canQueryFile(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.file.canCreateFile(user, context)
            } else if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.file.canViewFile(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE) {
                return await this.file.canUpdateFile(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE) {
                return await this.file.canDeleteFile(user, context)
            }
        } else if ( entity === 'Group' ) {
            if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.group.canCreateGroup(user, context)
            } else if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.group.canViewGroup(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE ) {
                return await this.group.canUpdateGroup(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE ) {
                return await this.group.canDeleteGroup(user, context)
            } else if ( action === PermissionService.ACTIONS.MODERATE ) {
                return await this.group.canModerateGroup(user, context)
            } else if ( action === PermissionService.ACTIONS.ADMIN ) {
                return await this.group.canAdminGroup(user, context)
            }
        } else if ( entity === 'GroupPost' ) {
            if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.groupPost.canViewGroupPost(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.groupPost.canCreateGroupPost(user, context)
            }
        } else if ( entity === 'GroupMember' ) {
            if ( action === PermissionService.ACTIONS.QUERY ) {
                return await this.groupMember.canQueryGroupMember(user, context)
            } else if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.groupMember.canViewGroupMember(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.groupMember.canCreateGroupMember(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE ) {
                return await this.groupMember.canUpdateGroupMember(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE ) {
                return await this.groupMember.canDeleteGroupMember(user, context)
            }
        } else if ( entity === 'Notification' ) {
            if ( action === PermissionService.ACTIONS.QUERY ) {
                return await this.notification.canQueryNotification(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.notification.canCreateNotification(user, context)
            } else if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.notification.canViewNotification(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE) {
                return await this.notification.canUpdateNotification(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE) {
                return await this.notification.canDeleteNotification(user, context)
            }
        } else if ( entity === 'Post' ) {
            if ( action === PermissionService.ACTIONS.QUERY ) {
                return await this.post.canQueryPost(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.post.canCreatePost(user, context)
            } else if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.post.canViewPost(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE) {
                return await this.post.canUpdatePost(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE) {
                return await this.post.canDeletePost(user, context)
            }
        } else if ( entity === 'PostComment' ) {
            if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.postComment.canViewPostComment(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.postComment.canCreatePostComment(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE ) {
                return await this.postComment.canUpdatePostComment(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE ) {
                return await this.postComment.canDeletePostComment(user, context)
            }
        } else if ( entity === 'PostReaction' ) {
            if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.postReaction.canViewPostReaction(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.postReaction.canCreatePostReaction(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE ) {
                return await this.postReaction.canUpdatePostReaction(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE ) {
                return await this.postReaction.canDeletePostReaction(user, context)
            }
        } else if ( entity === 'PostSubscription' ) {
            if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.postSubscription.canViewPostSubscription(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.postSubscription.canCreatePostSubscription(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE ) {
                return await this.postSubscription.canUpdatePostSubscription(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE ) {
                return await this.postSubscription.canDeletePostSubscription(user, context)
            }
        } else if ( entity === 'User' ) {
            if ( action === PermissionService.ACTIONS.QUERY ) {
                return await this.user.canQueryUser(user, context)
            } else if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.user.canViewUser(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.user.canCreateUser(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE ) {
                return await this.user.canUpdateUser(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE ) {
                return await this.user.canDeleteUser(user, context)
            }
        } else if ( entity === 'UserRelationship' ) {
            if ( action === PermissionService.ACTIONS.QUERY ) {
                return await this.userRelationship.canQueryUserRelationship(user, context)
            } else if ( action === PermissionService.ACTIONS.VIEW ) {
                return await this.userRelationship.canViewUserRelationship(user, context)
            } else if ( action === PermissionService.ACTIONS.CREATE ) {
                return await this.userRelationship.canCreateUserRelationship(user, context)
            } else if ( action === PermissionService.ACTIONS.UPDATE ) {
                return await this.userRelationship.canUpdateUserRelationship(user, context)
            } else if ( action === PermissionService.ACTIONS.DELETE ) {
                return await this.userRelationship.canDeleteUserRelationship(user, context)
            }
        } else if ( entity === 'Site' ) {
            if ( action === PermissionService.ACTIONS.MODERATE ) {
                return await this.canModerateSite(user, context)
            } else if ( action === PermissionService.ACTIONS.ADMIN ) {
                return await this.canAdminSite(user, context)
            } else if ( action === PermissionService.ACTIONS.SUDO ) {
                return this.canSudoSite(user, context)
            }
        }

        throw new ServiceError('unsupported', `Unsupported Entity(${entity}) or Action(${action}).`)
    }

    async canModerateSite(user, context) {
            return user.siteRole === 'moderator' || user.siteRole === 'admin' || user.siteRole === 'superadmin'
    }

    async canAdminSite(user, context) {
        return user.siteRole === 'admin' || user.siteRole === 'superadmin'
    }

    async canSudoSite(user, context) {
        return user.siteRole === 'superadmin'
    }

}
