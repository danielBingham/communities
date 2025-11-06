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

import * as shared from '@communities/shared'

export const Entities = {
    Group: 'Group',
    GroupMember: 'GroupMember',
    GroupPost: 'GroupPost',
    Post: 'Post',
    Site: 'Site'
}

export const Actions = {
    query: 'query',
    create: 'create',
    view: 'view',
    update: 'update',
    delete: 'delete',
    moderate: 'moderate',
    admin: 'admin',
    sudo: 'sudo'
}

const can = function(currentUser, action, entity, context) {
    if ( entity === Entities.Group ) {
        // SiteModerators need to be able to view the group in order to moderate posts in it.
        context.canModerateSite = can(currentUser, Actions.moderate, Entities.Site, context)

        if ( action === Actions.view) {
            return shared.permissions.Group.canViewGroup(currentUser, context) 
        } else if ( action === Actions.create) {
            return shared.permissions.Group.canCreateGroup(currentUser, context)
        } else if ( action === Actions.update) {
            return shared.permissions.Group.canUpdateGroup(currentUser, context)
        } else if ( action === Actions.delete) {
            return shared.permissions.Group.canDeleteGroup(currentUser, context)
        } else if ( action === Actions.moderate) {
            return shared.permissions.Group.canModerateGroup(currentUser, context) 
        } else if ( action === Actions.admin) {
            return shared.permissions.Group.canAdminGroup(currentUser, context) 
        } else {
            throw new Error(`Invalid Group Action: ${action}.`)
        }
    }
    else if ( entity === Entities.GroupMember ) {
        context.canModerateSite = can(currentUser, Actions.moderate, Entities.Site, context)

        context.canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context) 
        context.canAdminGroup = can(currentUser, Actions.admin, Entities.Group, context)

        // SiteModerators need to be able to view the group in order to moderate posts in it.
        if ( action === Actions.query) {
            return shared.permissions.GroupMember.canQueryGroupMember(currentUser, context)
        } else if ( action === Actions.view) {
            return shared.permissions.GroupMember.canViewGroupMember(currentUser, context) 
        } else if ( action === Actions.create) {
            return shared.permissions.GroupMember.canCreateGroupMember(currentUser, context)
        } else if ( action === Actions.update) {
            return shared.permissions.GroupMember.canUpdateGroupMember(currentUser, context)
        } else if ( action === Actions.delete) {
            return shared.permissions.GroupMember.canDeleteGroupMember(currentUser, context)
        } else {
            throw new Error(`Invalid GroupMember Action: ${action}.`)
        }
    } else if ( entity === Entities.GroupPost ) {
        context.canModerateSite = can(currentUser, Actions.moderate, Entities.Site, context)

        context.canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context) 
        context.canAdminGroup = can(currentUser, Actions.admin, Entities.Group, context)

        if ( action === Actions.view) {
            return shared.permissions.GroupPost.canViewGroupPost(currentUser, context) 
        } else if ( action === Actions.create) {
            return shared.permissions.GroupPost.canCreateGroupPost(currentUser, context)
        } else {
            throw new Error(`Invalid GroupPost Action: ${action}.`)
        }
    } else if ( entity === Entities.Site ) {
        if ( action === Actions.moderate) {
            return currentUser.siteRole === 'moderator' || currentUser.siteRole === 'admin' || currentUser.siteRole === 'superadmin'
        } else if ( action === Actions.admin ) {
            return currentUser.siteRole === 'admin' || currentUser.siteRole === 'superadmin'
        } else if ( action === Actions.sudo ) {
            return currentUser.siteRole === 'superadmin'
        } else {
            throw new Error(`Invalid Site Action: ${action}.`)
        }
    }
}

export default can
