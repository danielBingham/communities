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

module.exports = class GroupController {

    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userDAO = new UserDAO(core)
        this.fileDAO = new FileDAO(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        const relations = {}
        if ( requestedRelations && requestedRelations.includes("GroupMembers") ) {
            const params = [ results.list ]
            if ( currentUser ) {
                params.push(currentUser.id)
            }
            const memberResults = await this.groupMemberDAO.selectGroupMembers({
                where: `group_members.group_id = ANY($1::uuid[]) AND (group_members.status = 'member' ${ currentUser ? `OR group_members.user_id = $2` : ''})`,
                params: params 
            })

            relations['groupMembers'] = memberResults.dictionary
        }
        return relations 
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'groups.created_date DESC',
            relations: []
        }

        if ( 'relations' in request.query && Array.isArray(request.query.relations)) {
            query.relations = [ ...request.query.relations]
        }

        const currentUser = request.session.user

        // Restrict groups to only those that the user can view
        const userGroupsResults = await this.core.database.query(`
            SELECT group_id FROM group_members WHERE user_id = $1
        `, [ currentUser.id])

        const groupIds = userGroupsResults.rows.map((r) => r.group_id)

        if ( ( 'userId' in request.query ) && request.query.userId == currentUser.id ) {
            query.params.push(groupIds)
            query.where += `groups.id = ANY($${query.params.length}::uuid[])`
        } else {
            query.params.push(groupIds)
            query.where += `(groups.id = ANY($${query.params.length}::uuid[]) OR groups.type = 'open' OR groups.type = 'private')`
        }

        if ( request.query.slug && request.query.slug.length > 0 ) {
            query.params.push(request.query.slug)
            query.where += ` AND groups.slug = $${query.params.length}`
        }

        return query
    }

    async getGroups(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const query = await this.createQuery(request)
        const results = await this.groupDAO.selectGroups(query)
        const meta = await this.groupDAO.getGroupPageMeta(query)
        const relations = await this.getRelations(currentUser, results, query.relations)

        response.status(200).json({ 
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: relations
        })
    }

    async postGroups(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create a post.`,
                `You must must be authenticated to create a post.`)
        }

        const group = request.body

        group.slug = group.slug.toLowerCase()
        if ( ! group.slug.match(/[a-z0-9-_\.]/) ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser}) submitted a Group with an invalid slug.`,
                `The URL of the group may only contain letters, numbers, '-', '_', and '.'.`)
        }

        const existing = await this.groupDAO.getGroupBySlug(group.slug)

        if ( existing !== null ) {
            throw new ControllerError(400, 'conflict',
                `User(${currentUser}) attempting to create a group with a slug conflict.`,
                `A group with that URL already exists.  Please choose a different one.`)
        }

        await this.groupDAO.insertGroups(group)

        const entityResults = await this.groupDAO.selectGroups({
            where: `groups.slug = $1`,
            params: [ group.slug ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find Group(${group.slug}) after creation.`,
                `We encountered a bug on the server that we were unable to recover from.  Please report this bug!`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        const groupMember = {
            groupId: entity.id,
            userId: currentUser.id,
            status: 'member',
            role: 'admin'
        }
        await this.groupMemberDAO.insertGroupMembers(groupMember)

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async getGroup(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const groupId = request.params.id

        const results = await this.groupDAO.selectGroups({
            where: `groups.id = $1`,
            params: [groupId]
        })

        if ( results.list.length <= 0 || ! (groupId in results.dictionary)) {
            throw new ControllerError(404, 'not-found',
                `Group(${groupId}) not found for User(${currentUser.id}).`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const group = results.dictionary[groupId]

        const groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id)

        if ( ! group.isDiscoverable && groupMember === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to view Group(${groupId}) without permission.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }
       
       
        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: group,
            relations: relations
        })
    }

    async patchGroup(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const groupId = request.params.id

        const group = request.body

        if ( group.id !== groupId ) {
            throw new ControllerError(400, 'invalid', 
                `User(${currentUser.id}) submitted a group patch with the wrong id.`,
                `You used a different groupId in your patch and your route.  Ids must match.`)
        }

        const existing = await this.groupDAO.getGroupById(groupId)

        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to PATCH a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }


        const groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id)

        if ( ! groupMember && existing.isDiscoverable !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to PATCH a group they don't have permission to view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        if ( groupMember.role !== 'admin') {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to PATCH a group they don't have permission to edit.`,
                `You don't have permission to edit that group.`)
        }

        if ( 'slug' in group ) {
            group.slug = group.slug.toLower()
            if ( ! group.slug.match(/[a-z0-9\.\-_]/) ) {
                throw new ControllerError(400, 'invalid',
                    `User(${currentUser.id}) submitted a group with invalid slug '${group.slug}'.`,
                    `The URL you submitted is invalid. Only characters, numbers, '.', '-', and '_' are allowed.`)
            }

            const existingSlug = await this.groupDAO.getGroupBySlug(group.slug)

            if ( existingSlug !== null ) {
                throw new ControllerError(400, 'invalid',
                    `User(${currentUser.id}) submitted a group with a slug that's already in use.`,
                    `A group with that URL already exists.`)
            }
        }

        await this.groupDAO.updateGroup(group)

        const results = await this.groupDAO.selectGroups({
            where: `groups.id = $1`,
            params: [ groupId ]
        })

        const entity = results.dictionary[groupId]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find Group(${groupId}) after update.`,
                `We hit an error in the server we were unable to recover from.  Please report as a bug!`)
        }

        const relations = this.getRelations(currentUser, results)

        response.send(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteGroup(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const groupId = request.params.id
        
        const existing = await this.groupDAO.getGroupById(groupId)

        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to DELETE a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id)

        if ( ! groupMember && existing.isDiscoverable !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to DELETE a group they don't have permission to view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        if ( groupMember.role !== 'admin') {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to DELETE a group they don't have permission to edit.`,
                `You don't have permission to edit that group.`)
        }

        await this.groupDAO.deleteGroup(existing)

        response.status(200).json({
            entity: existing,
            relations: {}
        })

    }
}
