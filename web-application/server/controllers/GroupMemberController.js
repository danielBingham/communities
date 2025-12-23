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
    UserErrors, 

    FileDAO,
    GroupDAO, 
    GroupMemberDAO, 
    GroupSubscriptionDAO,
    PostSubscriptionDAO,
    UserDAO,  

    GroupService,
    GroupMemberService,
    NotificationService, 
    PermissionService,
    ValidationService
}  = require('@communities/backend')

const BaseController = require('./BaseController')
const ControllerError = require('../errors/ControllerError')

module.exports = class GroupMemberController extends BaseController {

    constructor(core) {
        super(core)

        this.fileDAO = new FileDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.groupSubscriptionDAO = new GroupSubscriptionDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)

        this.groupService = new GroupService(core)
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

            // If they are querying for ancestor memberships, then they can only see their own.
            if ( 'isAncestorMemberFor' in urlQuery ) {
                const parentIds = await this.groupService.getParentIds(context.group.id)
                query.params.push(parentIds)
                const parentIdsParam = query.params.length
                query.params.push(currentUser.id)
                const currentUserParam = query.params.length
                query.where = `group_members.group_id = ANY($${parentIdsParam}::uuid[]) AND group_members.user_id = $${currentUserParam}`

            } else {
                // Group moderators can see all users, even if they are blocked.
                query.params.push(context.group.id)
                query.where = `group_members.group_id = $${query.params.length}`
            }
        } 

        // Otherwise they can only view confirmed group members and their own
        // membership (pending or not).
        else {

            // If they are querying for ancestor memberships, then they can only see their own.
            if ( 'isAncestorMemberFor' in urlQuery) {
                const parentIds = await this.groupService.getParentIds(context.group.id)
                query.params.push(parentIds)
                const parentIdsParam = query.params.length
                query.params.push(currentUser.id)
                const currentUserParam = query.params.length
                query.where = `
                    group_members.group_id = ANY($${parentIdsParam}::uuid[]) AND group_members.user_id = $${currentUserParam}`

            } else {
                const blockResults = await this.core.database.query(`
                    SElECT user_id, friend_id
                        FROM user_relationships
                            WHERE (friend_id = $1) AND status = 'blocked'
                `, [currentUser.id])
                const blockIds = blockResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)

                // You can't see users who have blocked you.
                query.params.push(blockIds)
                const blockParam = query.params.length
                query.params.push(context.group.id)
                const groupParam = query.params.length
                query.params.push(currentUser.id)
                const currentUserParam = query.params.length

                query.where = `group_members.group_id = $${groupParam} 
                    AND (
                        group_members.status = 'member' 
                        OR (group_members.user_id = $${currentUserParam} AND group_members.user_id != ALL($${blockParam}::uuid[]))
                    )`
            }

        }

        if ( 'status' in urlQuery ) {
            if ( Array.isArray(urlQuery.status) ) {
                query.params.push(urlQuery.status)
                query.where += ` AND group_members.status = ANY($${query.params.length}::group_member_status[])`
            } else {
                query.params.push(urlQuery.status)
                query.where += ` AND group_members.status = $${query.params.length}`
            }
        }

        if ( 'role' in urlQuery) {
            if ( Array.isArray(urlQuery.role) ) {
                query.params.push(urlQuery.role)
                query.where += ` AND group_members.role = ANY($${query.params.length}::group_member_role[])`
            } else {
                query.params.push(urlQuery.role)
                query.where += ` AND group_members.role = $${query.params.length})`
            }
        }

        if ( 'user' in urlQuery ) {
            const userQuery = urlQuery.user
            if ( 'name' in userQuery ) {
                const results = await this.core.database.query(`
                    SELECT group_members.id 
                        FROM group_members
                            LEFT OUTER JOIN users ON group_members.user_id = users.id
                        WHERE group_members.group_id = $1 AND SIMILARITY(users.name, $2) > 0.05
                        ORDER BY SIMILARITY(users.name, $2) DESC
                `, [ context.group.id, userQuery.name ])

                query.params.push(results.rows.map((r) => r.id))
                query.where += ` AND group_members.id = ANY($${query.params.length}::uuid[])`
                query.order = `ARRAY_POSITION($${query.params.length}::uuid[], group_members.id)`

            }

            if ( 'status' in userQuery ) {
                const results = await this.core.database.query(`
                    SELECT group_members.id 
                        FROM group_members
                            LEFT OUTER JOIN users ON group_members.user_id = users.id
                        WHERE group_members.group_id = $1 AND users.status = $2 
                `, [ context.group.id, userQuery.status])

                query.params.push(results.rows.map((r) => r.id))
                query.where += ` AND group_members.id = ANY($${query.params.length}::uuid[])`
            }
        }

        if ( 'page' in urlQuery) {
            query.page = parseInt(urlQuery.page)
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

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, userMember: member })
        if ( canViewGroup !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) does not have permission to view Group(${groupId}).`,
                `That group either doesn't exist or you don't have permission to see it.`)
        }

        const canQueryGroupMember = await this.permissionService.can(currentUser, 'query', 'GroupMember', { group: group, userMember: member })
        if ( canQueryGroupMember !== true ) {
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
        const logger = 'logger' in request ? request.logger : this.core.logger
        const userErrors = new UserErrors(this.core, logger)

        const currentUser = request.session.user

        if ( ! currentUser ) {
            userErrors.addErrors(401, {
                type: 'not-authenticated',
                log: `User attempting to create a GroupMember without authenticating.`,
                message: `You must log in to create a GroupMember.`
            })
            response.status(userErrors.status).json(userErrors.getErrors())
            return
        }

        const groupId = request.params.groupId

        const groupMemberService = new GroupMemberService(this.core)

        const members = []
        if ( Array.isArray(request.body) ) {
            for (const member of request.body) {
                const [ entity, errors ] = await groupMemberService.inviteGroupMember(currentUser, groupId, member)
                if ( errors.hasErrors()) {
                    const errorResult = errors.getErrors()
                    return response.status(errors.status).json(errorResult) 
                }
                members.push(entity)
            }
        } else {
            const [ entity, errors ] = await groupMemberService.inviteGroupMember(currentUser, groupId, request.body)
            if ( errors.hasErrors()) {
                const errorResult = errors.getErrors()
                return response.status(errors.status).json(errorResult)
            }
            members.push(entity)
        }

        const memberIds = members.map((m) => m.id)
        const results = await this.groupMemberDAO.selectGroupMembers({
            where: `group_members.id = ANY($1::uuid[])`,
            params: [ memberIds ]
        })

        const relations = await this.getRelations(currentUser, results)

        response.status(201).json({
            dictionary: results.dictionary,
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

        const results = await this.groupMemberDAO.selectGroupMembers({
            where: `group_members.group_id = $1 AND group_members.user_id = $2`,
            params: [groupId, memberId]
        })

        if ( results.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `No member found for User in Group(${groupId}).`,
                `Either that member doesn't exist or you don't have permission to view it.`)
        }

        const entity = results.dictionary[results.list[0]]

        const canViewGroupMember = await this.permissionService.can(currentUser, 'view', 'GroupMember', 
            { group: existing, userMember: userMember, groupMember: entity })
        if ( ! canViewGroupMember ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get member for Group(${groupId}) without permission to view members.`,
                `Either that member doesn't exist or you don't have permission to view it.`)
        }

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
        if ( canViewGroup !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to edit a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        // We need the primary field to update.
        member.id = existing.id

        const canUpdateGroupMember = await this.permissionService.can(currentUser, 'update', 'GroupMember', 
            { group: group, userMember: currentMember, groupMember: existing }) 
        if ( canUpdateGroupMember !== true ) {
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

        if ( entity.status === 'member' ) {
            // If they are a member, they should have a group subscription.  If
            // they don't, create one for them.
            const subscription = await this.groupSubscriptionDAO.getGroupSubscriptionByGroupAndUser(entity.groupId, entity.userId)
            if ( subscription === null ) {
                await this.groupSubscriptionDAO.insertGroupSubscriptions({
                    groupId: entity.groupId,
                    userId: entity.userId
                })
            }
        }

        const relations = await this.getRelations(currentUser, results)

        await this.notificationService.sendNotifications(
            currentUser, 
            'GroupMember:update', 
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
        if ( canViewGroup !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canDeleteGroupMember = await this.permissionService.can(currentUser, 'delete', 'GroupMember', { group: group, userMember: userMember, groupMember: existing })
        // Current User must the member being removed or be an admin or a moderator.
        if ( canDeleteGroupMember !== true ) {
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

        // Delete their GroupSubscription.
        await this.core.database.query(
            `DELETE FROM group_subscriptions WHERE group_id = $1 AND user_id = $2`, 
            [ groupId, memberId ]
        )

        // If they lose permission to view the group's content by leaving the
        // group, then remove any subscriptions they have to posts in the
        // group.
        const memberUser = await this.userDAO.getUserById(memberId, [ 'status' ])
        const canViewGroupContent = await this.permissionService.can(memberUser, 'view', 'GroupPost', { group: group })
        if ( canViewGroupContent !== true ) {
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
