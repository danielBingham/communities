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
    GroupDAO, 
    GroupMemberDAO, 
    UserDAO, 
    FileDAO,
    GroupService,
    PermissionService,
    ValidationService
}  = require('@communities/backend')
const { schema } = require('@communities/shared')
const ControllerError = require('../errors/ControllerError')

module.exports = class GroupController {

    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userDAO = new UserDAO(core)
        this.fileDAO = new FileDAO(core)

        this.groupService = new GroupService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)

        this.groupSchema = new schema.GroupSchema()
    }

    async getRelations(currentUser, results, requestedRelations) {
        const relations = {}
        if ( requestedRelations && requestedRelations.includes("GroupMembers") ) {
            const params = [ results.list ]
            if ( currentUser ) {
                params.push(currentUser.id)
            }

            // Only members the user has permission to see.
            const memberResults = await this.groupMemberDAO.selectGroupMembers({
                where: `
                    group_members.group_id = ANY($1::uuid[]) 
                    AND group_members.group_id IN (
                        SELECT groups.id FROM groups
                            LEFT OUTER JOIN group_members ON groups.id = group_members.group_id
                        WHERE groups.type = 'open' 
                            ${ currentUser ? `OR (groups.type = 'private' AND group_members.user_id = $2 AND group_members.status = 'member')` : ''}
                            ${ currentUser ? `OR (groups.type = 'hidden' AND group_members.user_id = $2 AND group_members.status = 'member')` : ''}
                    )
                    AND (group_members.status = 'member' ${ currentUser ? `OR group_members.user_id = $2` : ''})
                `, 
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

        // Site moderators can always view all groups.
        const canModerateSite = await this.permissionService.can(currentUser, 'moderate', 'Site')
        if ( ! canModerateSite ) {
            // Restrict the query to only those groups the currentUser can see.
            query.params.push(currentUser.id)

            if ( this.core.features.has('issue-165-subgroups') ) {
                query.where = `groups.id IN (
                        SELECT groups.id FROM groups
                            LEFT OUTER JOIN group_members ON groups.id = group_members.group_id AND group_members.user_id = $1
                            LEFT OUTER JOIN group_members as parent_members ON groups.parent_id = parent_members.group_id AND parent_members.user_id = $1
                        WHERE 
                            (groups.type = 'open' AND (group_members.user_id IS NULL OR group_members.status != 'banned'))
                            OR ( 
                                (groups.type = 'private' OR groups.type = 'private-open') 
                                AND (group_members.user_id IS NULL OR group_members.status != 'banned')
                            )
                            OR ( 
                                groups.type = 'hidden' 
                                AND (
                                    (group_members.user_id = $1 AND group_members.status != 'banned') 
                                    OR (parent_members.user_id = $1 AND parent_members.status != 'banned' AND parent_members.role = 'admin')
                                )
                            )
                            OR ( 
                                ( groups.type = 'hidden-open' OR groups.type = 'hidden-private' ) 
                                AND (
                                    (group_members.user_id = $1 AND group_members.status != 'banned') 
                                    OR (parent_members.user_id = $1 AND parent_members.status = 'member')
                                )
                            )
                    )
                `
            } else {
                query.where = `groups.id IN (
                    SELECT groups.id FROM groups LEFT OUTER JOIN group_members ON groups.id = group_members.group_id WHERE (group_members.user_id = $1 AND group_members.status = 'member') OR groups.type = 'open'
                )`
            }
        }

        // Get only the groups the currentUser is a member of with 'memberStatus'
        if ( 'memberStatus' in request.query ) {

            let membershipSQL = `SELECT group_id FROM group_members WHERE user_id = $1`
            const membershipParams = [ currentUser.id ]
            if ( request.query.memberStatus !== 'any' ) {
                membershipSQL += ` AND status = $2`
                membershipParams.push(request.query.memberStatus)
            }
            const membershipResults = await this.core.database.query(membershipSQL, membershipParams)

            const memberships = membershipResults.rows.map((r) => r.group_id)

            query.params.push(memberships)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and} groups.id = ANY($${query.params.length}::uuid[])`
        } 

        // Get a single group matching `group.slug`.
        if ( request.query.slug && request.query.slug.length > 0 ) {
            query.params.push(request.query.slug)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and} groups.slug = $${query.params.length}`
        }

        if ( request.query.title && request.query.title.length > 0 ) {
            query.params.push(request.query.title)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and} SIMILARITY(groups.title, $${query.params.length}) > 0.05`
            query.order = `SIMILARITY(groups.title, $${query.params.length}) desc`
        }

        if ( this.core.features.has('issue-165-subgroups') ) {
            if ( 'isChildOf' in request.query ) {
                query.params.push(request.query.isChildOf)

                const and = query.params.length > 1 ? ' AND ' : ''
                query.where += `${and} groups.parent_id = $${query.params.length}`
            }

            if ( 'isAncestorOf' in request.query ) {
                const parentIds = await this.groupService.getParentIds(request.query.isAncestorOf)
                query.params.push(parentIds)

                const and = query.params.length > 1 ? ' AND ' : ''
                query.where += `${and} groups.id = ANY($${query.params.length}::uuid[])`
            }
        }

        if ( 'page' in request.query && parseInt(request.query.page) > 0 ) {
            query.page = parseInt(request.query.page)
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

        const group = this.groupSchema.clean(request.body)

        let context = {}
        if ( 'parentId' in group ) {
            context.groupId = group.parentId
        }

        const canCreateGroup = await this.permissionService.can(currentUser, 'create', 'Group', context)
        if ( ! canCreateGroup ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to create a group without permission.`,
                `You are not authorized to create a new Group.`)
        }

        group.slug = group.slug.toLowerCase()
        const slugErrors = this.groupSchema.properties.slug.validate(group.slug)
        if ( slugErrors.length > 0 ) {
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

        const validationErrors = await this.validationService.validateGroup(currentUser, group)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid group: ${logString}`,
                errorString)
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

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group })
        if ( ! canViewGroup ) {
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
        const group = this.groupSchema.clean(request.body)

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

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group:  existing})
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to PATCH a group they don't have permission to view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canUpdateGroup = await this.permissionService.can(currentUser, 'update', 'Group', { group: existing })
        if ( ! canUpdateGroup ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to PATCH a group they don't have permission to edit.`,
                `You don't have permission to edit that group.`)
        }

        const validationErrors = await this.validationService.validateGroup(currentUser, group, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid group: ${logString}`,
                errorString)
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

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteGroup(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to delete a group.`,
                `You must must be authenticated to delete a group.`)
        }

        const groupId = request.params.id
        const validationErrors = this.groupSchema.properties.id.validate(groupId) 
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User attempted to delete a Group with an invalid UUID: ${logString}`,
                errorString)
        }
        
        const existing = await this.groupDAO.getGroupById(groupId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to DELETE a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group:  existing})
        if ( ! canViewGroup ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to DELETE a group they don't have permission to view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canDeleteGroup = await this.permissionService.can(currentUser, 'delete', 'Group', { group: existing })
        if ( ! canDeleteGroup ) {
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
