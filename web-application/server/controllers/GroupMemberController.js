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

const { GroupDAO, GroupMemberDAO, UserDAO, FileDAO }  = require('@communities/backend')
const ControllerError = require('../errors/ControllerError')

module.exports = class GroupMemberController {

    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userDAO = new UserDAO(core)
        this.fileDAO = new FileDAO(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        return { }
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'group_members.created_date DESC'
        }

        const currentUser = request.session.user

        return query
    }

    async getGroupMembers(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const groupId = request.params.groupId 

        const existing = await this.groupDAO.getGroupById(groupId)
        
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get members for Group(${groupId}), not found.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const member = await this.groupMemberDAO.getGroupMemberForGroupAndUser(groupId, currentUser.id)

        if ( member === null && existing.isDiscoverable !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get members for Group(${groupId}), they don't have permission.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const query = await this.createQuery(request)
        const results = await this.groupDAO.selectGroupMembers(query)
        const meta = await this.groupDAO.getGroupMemberPageMeta(query)
        const relations = await this.getRelations(currentUser, results)

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

        const userMember = await this.groupMemberDAO.getGroupMemberForGroupAndUser(groupId, currentUser.id) 

        // CurrentUser must be a member of the group.
        if ( ! userMember && group.isDiscoverable !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to add a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        } else if ( ! userMember && group.isDiscoverable ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to add a member to a Group(${groupId}) they aren't a member of.`,
                `You're not authorized to add members to that group.`)
        }

        // Current User must be an admin or a moderator.
        if ( userMember.role !== 'admin' && userMember.role !== 'moderator' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to add a member to a Group(${groupId}) without permission.`,
                `You're not authorized to add members to that group.`)
        }

        // If adding a admin or moderator, CurrentUser must be an admin.
        if ( ( member.role == 'admin' || member.role == 'moderator') && userMember.role !== 'admin') {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to add an admin or moderator to Group(${groupId}) without permission.`,
                `You're not authorized to add admins or moderators to that group.`)
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
        const memberId = request.params.id

        const existing = await this.groupDAO.getGroupById(groupId)
        
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get member for Group(${groupId}), not found.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const userMember = await this.groupMemberDAO.getGroupMemberForGroupAndUser(groupId, currentUser.id)

        if ( userMember === null && existing.isDiscoverable !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to get member for Group(${groupId}), they don't have permission.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const results = await this.groupMemberDAO.selectGroupMembers({
            where: `group_members.group_id = $1 AND group_members.user_id = $2`,
            params: [groupId, memberId]
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
        const memberId = request.params.memberId

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

        const group = await this.groupDAO.getGroupById(groupId)

        // Target group must exist.
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

        const userMember = await this.groupMemberDAO.getGroupMemberForGroupAndUser(groupId, currentUser.id) 

        // CurrentUser must be a member of the group.
        if ( ! userMember && group.isDiscoverable !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to edit a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        } else if ( ! userMember && group.isDiscoverable ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to edit a member to a Group(${groupId}) they aren't a member of.`,
                `You're not authorized to edit members of that group.`)
        }

        // Current User must be an admin or a moderator.
        if ( userMember.role !== 'admin' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to edit a member of a Group(${groupId}) without permission.`,
                `You're not authorized to edit members of that group.`)
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
        const memberId = request.params.id

        const group = await this.groupDAO.getGroupById(groupId)

        // Target group must exist.
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

        const userMember = await this.groupMemberDAO.getGroupMemberForGroupAndUser(groupId, currentUser.id) 

        // CurrentUser must be a member of the group.
        if ( ! userMember && group.isDiscoverable !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) they can't view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        } else if ( ! userMember && group.isDiscoverable ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) they aren't a member of.`,
                `You're not authorized to remove members to that group.`)
        }

        // Current User must be an admin or a moderator.
        if ( userMember.role !== 'admin' && userMember.role !== 'moderator' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to remove a member to a Group(${groupId}) without permission.`,
                `You're not authorized to remove members to that group.`)
        }

        // If removing a admin or moderator, CurrentUser must be an admin.
        if ( ( existing.role == 'admin' || existing.role == 'moderator') && userMember.role !== 'admin') {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to remove an admin or moderator to Group(${groupId}) without permission.`,
                `You're not authorized to remove admins or moderators to that group.`)
        }

        await this.groupMemberDAO.deleteGroupMember(existing)

        response.status(200).json({
            entity: existing,
            relations: {}
        })
    }
}
