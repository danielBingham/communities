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
const GroupMemberDAO = require('../../daos/GroupMemberDAO')
const PostDAO = require('../../daos/PostDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { util, permissions } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.postDAO = new PostDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        // If we don't have the group, then attempt to load it.
        if ( (required.includes('group') || optional.includes('group')) 
            && (! util.objectHas(context, 'group') || context.group === null)) 
        {
            // If group is in context and set to null, then we don't want to
            // try to load it.  We know it's null.
            if ( context.group !== null ) {
                // Load it from the groupId first.
                if ( util.objectHas(context, 'groupId') && context.groupId !== null ) {
                    context.group = await this.groupDAO.getGroupById(context.groupId)
                }  
                // Otherwise attempt to use the userMember.
                else if ( util.objectHas(context, 'userMember') && context.userMember !== null 
                    && context.userMember.groupId !== undefined && context.userMember.groupId !== null ) 
                {
                    context.group = await this.groupDAO.getGroupById(context.userMember.groupId)
                }
                // Finally, check the post.
                else if ( util.objectHas(context, 'post') && context.post !== null
                    && util.objectHas(context.post, 'groupId') && context.post.groupId !== null)
                {
                    context.group = await this.groupDAO.getGroupById(context.post.groupId)
                }
            }

            if ( required.includes('group') && (! util.objectHas(context, 'group') || context.group === null) ) { 
                throw new ServiceError('missing-context', `'group' missing from context.`)
            }
        } 

        // If we don't have the user's groupMember then load it.
        if ( (required.includes('userMember') || optional.includes('userMember')) 
            && (! util.objectHas(context, 'userMember') || context.userMember === null) ) 
        {
            // If userMember is in context and set to null, then we don't want
            // to try to load it.
            if ( context.userMember !== null ) {
                context.userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.group.id, user.id, true)
            }

            if ( required.includes('userMember') && (! util.objectHas(context, 'userMember') || context.userMember === null) ) {
                throw new ServiceError('missing-context', `'userMember' missing from context.`)
            }
        } 

        if ( required.includes('groupMember') && (! util.objectHas(context, 'groupMember' ) || context.groupMember === null) ) {
            throw new ServiceError('missing-context', `'groupMember' missing from context.`)
        } 

        // ===== Ensure all elements of Group context match. ======
        
        let groupId = null
        if ( util.objectHas(context, 'groupId') && context.groupId !== null) {
            groupId = context.groupId
        }

        if ( util.objectHas(context, 'group') && context.group !== null ) {
            if ( groupId === null ) {
                groupId = context.group.id
            } else if ( context.group.id !== groupId ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Groups.`)
            }
        }

        if ( util.objectHas(context, 'userMember') && context.userMember !== null ) {
            if ( groupId === null ) {
                groupId = context.userMember.groupId
            } else if ( context.userMember.groupId !== groupId ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Groups.`)
            }
        }

        if ( util.objectHas(context, 'groupMember') && context.groupMember !== null ) {
            if ( groupId === null ) {
                groupId = context.groupMember.groupId
            } else if ( context.groupMember.groupId !== groupId )  {
                throw new ServiceError('context-mismatch', `Context includes elements from different Groups.`)
            }
        }

        if ( util.objectHas(context, 'post') && context.post !== null ) {
            if ( groupId === null ) {
                groupId = context.post.groupId
            } else if ( context.post.groupId !== groupId ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Groups.`)
            }
        }
    }

    async canCreateGroup(user, context) {
        return permissions.Group.canCreateGroup(user, context)
    }

    async canViewGroup(user, context) {
        await this.ensureContext(user, context, [ 'group' ], [ 'userMember' ])

        // Site moderators can always view groups.
        context.canModerateSite = await this.permissionService.can(user, 'moderate', 'Site') 

        return permissions.Group.canViewGroup(user, context)
    }

    async canUpdateGroup(user, context) {
        await this.ensureContext(user, context, [ 'group'], [ 'userMember' ])

        return permissions.Group.canUpdateGroup(user, context)
    }

    async canDeleteGroup(user, context) {
        await this.ensureContext(user, context, [ 'group'], [ 'userMember' ])

        return permissions.Group.canDeleteGroup(user, context)
    }

    async canModerateGroup(user, context) {
        // TECHDEBT We don't actually need the `group` here and it's extra queries.  We just need the groupId, but 
        // I don't want to go down the rabbithole of pulling that off of all the context right now.
        await this.ensureContext(user, context, [ 'group' ], [ 'userMember' ])

        return permissions.Group.canModerateGroup(user, context)
    }

    async canAdminGroup(user, context) {
        await this.ensureContext(user, context, [ 'group'], [ 'userMember' ])

        return permissions.Group.canAdminGroup(user, context)
    }

    async canViewGroupContent(user, context) {
        await this.ensureContext(user, context, [ 'group' ], [ 'userMember' ])

        // Site moderators can always view group content.
        context.canModerateSite = await this.permissionService.can(user, 'moderate', 'Site')

        return permissions.Group.canViewGroupContent(user, context)
    }

}
