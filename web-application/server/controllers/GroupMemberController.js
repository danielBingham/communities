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
    PermissionService 
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
            const pendingInvitees = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[]) AND users.status = 'invited'`, params: [pendingUserIds] }, [ 'email' ])

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
                `User must be authenticated to create a post.`,
                `You must must be authenticated to create a post.`)
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

        // Target group must exist.
        if ( ! group ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to add a member to a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const userResults = await this.core.database.query(`
            SELECT id FROM users WHERE id = $1
        `, [ member.userId])

        // Target user must exist.
        if ( userResults.rows.length <= 0 ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempting to add User(${member.userId}) who doesn't exist to Group(${member.groupId}).`,
                `That user doesn't exist.`)
        }

        const userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id) 


        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, groupMember: userMember })
        const canViewGroupContent = await this.permissionService.can(currentUser, 'view', 'Group:content', { group: group, groupMember: userMember })
        const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { group: group, groupMember: userMember })

        const existing = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, member.userId)

        // If a member already exists, then bail out.
        if ( existing && existing.userId == member.userId ) {
            if ( ! canViewGroup ) {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempting to add a member (already added) to a group without permission to view it.`,
                    `Either that group doesn't exist or you don't have permission to see it.`)
            } else if ( member.userId == currentUser.id ) {
                throw new ControllerError(400, 'exists',
                    `User(${member.userId}) has already been added to Group(${member.groupId}) with status '${userMember.status}'.`,
                    `You've already been added with status '${userMember.status}'.`)
            } else if ( canModerateGroup ) {
                throw new ControllerError(400, 'exists',
                    `User(${member.userId}) has already been added to Group(${member.groupId}) with status '${userMember.status}'.`,
                    `That user has already been added with status '${userMember.status}'.`)
            } else {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) is not authorized to add members to Group(${groupId}).`,
                    `You aren't authorized to add members.`)
            }
        }
        
        if ( ! canViewGroup ) { 
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to add a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        // Check permissions by group type.
        if ( group.type == 'hidden' ) {
            // If the current user isn't a member, then they can't even know the group exists.
            if ( ! userMember ) {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempting to add a member to a Group(${groupId}) they can't view.`,
                    `Either that group doesn't exist or you don't have permission to see it.`)
            } 
            // Only admins and moderators can invite.
            else if ( ! canModerateGroup ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempting to add user to Group(${groupId}) without permission.`,
                    `You do not have permission to invite members to this group.`)
            }
                    
        }
        else if ( group.type == 'private' ) {
            if ( userMember && ! canModerateGroup ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempting to add user to Group(${groupId}) without permission.`,
                    `You do not have permission to invite members to this group.`)
            } else if ( ! userMember && member.userId !== currentUser.id ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempting to add user to Group(${groupId}) without permission.`,
                    `You do not have permission to invite members to this group.`)
            }
        }
        else if ( group.type == 'open') {
            if ( userMember && ! canModerateGroup ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempting to add user to Group(${groupId}) without permission.`,
                    `You do not have permission to invite members to this group.`)
            } else if ( ! userMember && member.userId !== currentUser.id ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempting to add user to Group(${groupId}) without permission.`,
                    `You do not have permission to invite members to this group.`)
            }
        }
        else { 
            throw new ControllerError(500, 'server-error',
                `Unknown type for Group(${groupId}).`,
                `We encountered an error we couldn't recover from.  Please report it as a bug.`)
        }


        // Set the status appropriately.
        member.role = 'member'
        if ( group.type == 'hidden' ) {
            member.status = 'pending-invited'
        }
        else if ( group.type == 'private' ) {
            if ( member.userId == currentUser.id ) {
                member.status = 'pending-requested'
            } else {
                member.status = 'pending-invited'
            }
        }
        else if ( group.type == 'open' ) {
            if ( member.userId == currentUser.id ) {
                member.status = 'member'
            } else {
                member.status = 'pending-invited'
            }
        }
        else { 
            throw new ControllerError(500, 'server-error',
                `Unknown type for Group(${groupId}).`,
                `We encountered an error we couldn't recover from.  Please report it as a bug.`)
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

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: existing, groupMember: userMember})
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get member for Group(${groupId}), they don't have permission.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canViewGroupContent = await this.permissionService.can(currentUser, 'view', 'Group:content', { group:existing, groupMember:userMember })
        if ( ! canViewGroupContent && memberId !== currentUser.id ) {
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

        const userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id) 

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, groupMember: userMember})
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to edit a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canAdminGroup = await this.permissionService.can(currentUser, 'admin', 'Group', { group: group, groupMember: userMember })

        if ( userMember.userId == existing.userId && existing.status == 'pending-invited' && member.status == 'member') {
            // Pass them through, they're allowed to update themselves in this
            // case. TECHDEBT Yeah, this is hacky, but I'm trying to push
            // through burnout and this is what I got at the moment.
        } 
        // Current User must be an admin. 
        else if ( ! canAdminGroup ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to edit a member of a Group(${groupId}) without permission.`,
                `You're not authorized to edit members of that group.`)
        }

        // We need the primary field to update.
        member.id = existing.id
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

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, groupMember: userMember })
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { group: group, groupMember: userMember })
        const canAdminGroup = await this.permissionService.can(currentUser, 'admin', 'Group', { group: group, groupMember: userMember })

        // Current User must the member being removed or be an admin or a moderator.
        if ( existing.role === 'member' && ! ( (currentUser.id === existing.userId) || canModerateGroup) ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) without permission.`,
                `You're not authorized to remove members to that group.`)
        }

        if ( existing.role === 'moderator' && ! ( (currentUser.id === existing.userId) || canAdminGroup) ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) without permission.`,
                `You're not authorized to remove that member from that group.`)
        }

        if ( existing.role === 'admin' && currentUser.id !== existing.userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) without permission.`,
                `You're not authorized to remove that member from that group.`)
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
