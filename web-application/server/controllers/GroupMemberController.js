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

const { 
    FileDAO,
    GroupDAO, 
    GroupMemberDAO, 
    PostSubscriptionDAO,
    UserDAO,  

    NotificationService, 
    PermissionService,
    ValidationService
}  = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class GroupMemberController {

    constructor(core) {
        this.core = core

        this.fileDAO = new FileDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)

        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async getRelations(currentUser, results, requestedRelations, context) {
        const memberUserIds = []
        const pendingUserIds = []
        for(const groupMemberId of results.list) {
            const member = results.dictionary[groupMemberId]
            if ( member.status === 'member' ) {
                memberUserIds.push(member.userId)
            } else {
                pendingUserIds.push(member.userId)
            }
        }

        let canModerateGroup = false
        if ( context !== undefined && context !== null ) {
            canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { group: context.group, groupMember: context.member })
        }

        let userDictionary = {}
        if ( canModerateGroup ) {
            const memberUsers = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [memberUserIds] })
            const pendingUsers = await this.userDAO.selectUsers({where: `users.id = ANY($1::uuid[]) AND users.status != 'invited'`, params: [ pendingUserIds] })
            const pendingInvitees = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[]) AND users.status = 'invited'`, params: [pendingUserIds], fields: [ 'email' ] })

            userDictionary = { ...memberUsers.dictionary, ...pendingUsers.dictionary, ...pendingInvitees.dictionary }
        } else {
            const memberUsers = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [memberUserIds] })
            userDictionary = memberUsers.dictionary
        }

        return { 
            users: userDictionary 
        }
    }

    async createQuery(currentUser, urlQuery, context) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'group_members.created_date DESC',
            full: false
        }

        const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { group: context.group, groupMember: context.member })

        // If they are a moderator or admin, they can view all group members,
        // including ones who are still pending.
        if ( canModerateGroup ) {
            query.params.push(context.group.id)
            query.where = `group_members.group_id = $${query.params.length}`
        } 

        // Otherwise they can only view confirmed group members and their own
        // membership (pending or not).
        else {
            query.params.push(context.group.id)
            query.params.push(currentUser.id)
            query.where = `group_members.group_id = $${query.params.length-1} 
                AND (group_members.status = 'member' OR group_members.user_id = $${query.params.length})`
        }

        return query
    }

    async getGroupMembers(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve GroupMembers.`,
                `You must be authenticated to retrieve GroupMembers.`)
        }

        const groupId = request.params.groupId

        const group = await this.groupDAO.getGroupById(groupId)
        if ( group === null ) {
            throw new ControllerError(404, 'not-found',
                `No Group(${groupId}).`,
                `That group either doesn't exist or you don't have permission to see it.`)
        }

        const member = await this.groupMemberDAO.getGroupMemberByGroupAndUser(group.id, currentUser.id, true)

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, groupMember: member })
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) does not have permission to view Group(${groupId}).`,
                `That group either doesn't exist or you don't have permission to see it.`)
        }

        const canViewGroupContent = await this.permissionService.can(currentUser, 'view', 'Group:content', { group: group, groupMember: member })
        if ( ! canViewGroupContent ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) does not have permission to view membership of Group(${groupId}).`,
                `You don't have permission to view members of that group.`)
        }

        const query = await this.createQuery(currentUser, request.query, { group: group, member: member })

        // Empty response.
        if ( query.page == -1 ) {
            response.status(200).json({
                dictionary: {},
                list: [],
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                },
                relations: {}
            })
            return
        }
        
        const results = await this.groupMemberDAO.selectGroupMembers(query)
        const meta = await this.groupMemberDAO.getGroupMemberPageMeta(query)
        const relations = await this.getRelations(currentUser, results, [], { group: group, member: member })

        response.status(200).json({ 
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: relations
        })
    }

    async postGroupMembers(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to add members to a Group.`,
                `You must must be authenticated to add members to a Group.`)
        }

        const groupId = request.params.groupId
        const member = request.body

        // GroupIds must be consistent.
        if ( member.groupId !== groupId ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempting to add member to Group(${member.groupId}) on Group(${groupId})'s endpoint.`,
                `The groupId in the member and the route must match.`)
        }

        const group = await this.groupDAO.getGroupById(groupId)
        if ( ! group ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to add a member to a Group that doesn't exist.`,
                `Either that Group doesn't exist or you don't have permission to see it.`)
        }

        const currentMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id) 

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, groupMember: currentMember })
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to add a member to a group without permission to view it.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canCreateGroupMember = await this.permissionService.can(currentUser, 'create', 'GroupMember', 
            { group: group, userMember: currentMember, groupMember: member })

        if ( ! canCreateGroupMember ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to create a new member in Group(${groupId}) without authorization.`,
                `You are not authorized to add members to that Group.`)
        }

        const existing = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, member.userId)

        // If a member already exists, then bail out.
        if ( existing && existing.userId == member.userId ) {
            throw new ControllerError(409, 'conflict',
                `User attempting to add a member to a Group that has already been added.`,
                `That member has already been added to that Group.`)
        }

        const validationErrors = await this.validationService.validateGroupMember(currentUser, member)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid GroupMember: ${logString}`,
                errorString)
        }

        await this.groupMemberDAO.insertGroupMembers(member)

        const results = await this.groupMemberDAO.selectGroupMembers({
            where: `group_members.user_id = $1 AND group_members.group_id = $2`,
            params: [member.userId, member.groupId]
        })

        if ( results.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find GroupMember(${member.groupId},${member.userId}) after insertion.`,
                `We encountered an error we couldn't recover from. Please report as a bug!`)
        }

        const entity = results.dictionary[results.list[0]]

        const relations = await this.getRelations(currentUser, results)

        await this.notificationService.sendNotifications(
            currentUser, 
            'Group:member:create', 
            {
                group: group,
                member: entity
            }
        )

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async getGroupMember(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const groupId = request.params.groupId 
        const memberId = request.params.userId

        const existing = await this.groupDAO.getGroupById(groupId)
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get member for Group(${groupId}), not found.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id)

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: existing, userMember: userMember})
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get member for Group(${groupId}), they don't have permission.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canViewGroupMember = await this.permissionService.can(currentUser, 'view', 'GroupMember', { group:existing, userMember: userMember })
        if ( ! canViewGroupMember ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get member for Group(${groupId}) without permission to view content.`,
                `Either that member doesn't exist or you don't have permission to view it.`)
        }

        const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { group: existing, groupMember: userMember })

        const canViewFull = canModerateGroup || (currentUser && userMember && currentUser.id == userMember.userId)

        const results = await this.groupMemberDAO.selectGroupMembers({
            where: `group_members.group_id = $1 AND group_members.user_id = $2`,
            params: [groupId, memberId],
            full: canViewFull
        })

        const entity = results.dictionary[results.list[0]]

        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    async patchGroupMember(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create a post.`,
                `You must must be authenticated to create a post.`)
        }

        const groupId = request.params.groupId
        const memberId = request.params.userId

        const member = request.body

        // GroupIds must be consistent.
        if ( member.groupId !== groupId ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempting to edit member to Group(${member.groupId}) on Group(${groupId})'s endpoint.`,
                `The groupId in the member and the route must match.`)
        }

        // MemberIds must be consistent.
        if( member.userId !== memberId ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempting to patch User(${member.userId}) instead of User(${memberId}) on Group(${groupId}).`,
                `The userId in the route and the member must match.`)
        }

        // Target group must exist.
        const group = await this.groupDAO.getGroupById(groupId)
        if ( ! group ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to edit a member to a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const existing = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, memberId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to patch a non-existent GroupMember(${memberId}) of Group(${groupId}).`,
                `You can't PATCH a GroupMember that doesn't exist.`)
        }

        const currentMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id) 

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, userMember: currentMember})
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to edit a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        // We need the primary field to update.
        member.id = existing.id

        const canUpdateGroupMember = await this.permissionService.can(currentUser, 'update', 'GroupMember', 
            { group: group, userMember: currentMember, groupMember: member }) 
        if ( ! canUpdateGroupMember ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to update a GroupMember without authorization.`,
                `You are not authorized to update that GroupMember.`)
        }

        const validationErrors = await this.validationService.validateGroupMember(currentUser, member, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid GroupMember: ${logString}`,
                errorString)
        }

        await this.groupMemberDAO.updateGroupMember(member)

        const results = await this.groupMemberDAO.selectGroupMembers({
            where: `group_members.user_id = $1 AND group_members.group_id = $2`,
            params: [member.userId, member.groupId]
        })

        if ( results.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find GroupMember(${member.groupId},${member.userId}) after insertion.`,
                `We encountered an error we couldn't recover from. Please report as a bug!`)
        }

        const entity = results.dictionary[results.list[0]]

        const relations = await this.getRelations(currentUser, results)

        await this.notificationService.sendNotifications(
            currentUser, 
            'Group:member:update', 
            {
                group: group,
                previousStatus: existing.status,
                previousRole: existing.role,
                member: entity
            }
        )

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteGroupMember(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated.`,
                `You must must be authenticated.`)
        }

        const groupId = request.params.groupId
        const memberId = request.params.userId

        // Target group must exist.
        const group = await this.groupDAO.getGroupById(groupId)
        if ( ! group ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to delete a member to a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const existing = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, memberId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to patch a non-existent GroupMember(${memberId}) of Group(${groupId}).`,
                `You can't PATCH a GroupMember that doesn't exist.`)
        }

        const userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id) 

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, userMember: userMember })
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canDeleteGroupMember = await this.permissionService.can(currentUser, 'delete', 'GroupMember', { group: group, userMember: userMember, groupMember: existing })
        // Current User must the member being removed or be an admin or a moderator.
        if ( ! canDeleteGroupMember ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to remove a member from a Group(${groupId}) without authorization.`,
                `You're not authorized to remove that GroupMember.`)
        }

        if ( existing.role === 'admin' ) {
            // If this is the last admin, don't let them leave until they promote a new one.
            const groupAdmins = await this.core.database.query(`
                SELECT user_id FROM group_members WHERE group_id = $1 AND role = 'admin'
            `, [ groupId ])

            if ( groupAdmins.rows.length <= 1 ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) aattempting to remove the last admin from Group(${groupId}).`,
                    `You cannot remove the last admin from a group.`)
            }
        }

        await this.groupMemberDAO.deleteGroupMember(existing)

        // If they lose permission to view the group's content by leaving the
        // group, then remove any subscriptions they have to posts in the
        // group.
        const memberUser = await this.userDAO.getUserById(memberId)
        const canViewGroupContent = await this.permissionService.can(memberUser, 'view', 'Group:content', { group: group })
        if ( ! canViewGroupContent ) {
            const subscriptionResults = await this.core.database.query(`
                SELECT post_subscriptions.id FROM post_subscriptions
                    LEFT OUTER JOIN posts ON post_subscriptions.post_id = posts.id
                    WHERE posts.group_id = $1
            `, [ group.id ])

            const subscriptionIds = subscriptionResults.rows.map((r) => r.id)

            await this.postSubscriptionDAO.deletePostSubscriptions(subscriptionIds)
        }

        response.status(200).json({
            entity: existing,
            relations: {}
        })
    }
}
