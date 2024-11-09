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

import { Uuid } from 'uuid'

import ServiceError from '../errors/ServiceError'

import { RoleDAO } from '../daos/RoleDAO'

import { PermissionService } from './PermissionService'

export class RoleService {

    constructor(core) {
        this.core = core

        this.roleDAO = new RoleDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async get(name, context) {
        const query = {
            where: `name = $1`,
            params: [ name ]
        }

        const contextSQL = this.permissionService.getContextSQL(query, context)

        const results = await this.roleDAO.selectRoles(query.where, query.params)
    
        if ( results.list.length <= 0 ) {
            return null
        } else {
            return results.dictionary[results.list[0]]
        }
    }

    /**
     * Grant a role to a user.
     *
     * @param {string} role The role name.
     * @param {number} userId The id of the user.
     * @param {Object} context The required context for the role being granted.
     *
     * @return {Promise<boolean>}
     */
    async grant(roleId, userId) {
        await this.roleDAO.insertUserRoles({ roleId: roleId, userId: userId })
    }

    async revoke(roleId, userId) {
        await this.roleDAO.deleteUserRoles({ roleId: roleId, userId: userId})
    }

    async clone(roleId, name, context) {
        const baseResults = await this.roleDAO.selectRoles(`roles.id = $1`, [ roleId ])
        const baseRole = baseResults.dictionary[baseResults.list[0]]

        const newRole = { ...baseRole }

        newRole.id = Uuid.v4(),
        newRole.name = name

        await this.roleDAO.insert(newRole)

        const basePermissionResults = await this.permissionsDAO.selectPermissions(
            `permissions.role_id = $1`, 
            [ baseRole.id ]
        )
        const permissions = basePermissionResults.list.map((i) => basePermissionResults.dictionary[i])

        for ( const permission of permissions ) {
            delete permission.id 
            permission.roleId = newRole.id 
            
            this.permissionService.overrideContext(permission, context)
        }
        await this.permissionService.grant(permissions)

        return newRole.id
    }

    async drop(roleId) {
        await this.roleDAO.deleteRoles(roleId)
    }

    /**
     * Create the initial roles for a paper and grant the initial permissions for those roles.
     *
     * @param {number} paperId
     *
     * @return {Promise<void>}
     */
    async createPaperRoles(paperId) {
        const correspondingAuthorId = Uuid.v4()
        const authorId = Uuid.v4()

        await this.roleDAO.insertRoles([
            { 
                id: correspondingAuthorId,
                name: 'corresponding-author',
                displayName: 'Corresponding Author', 
                description: `One of this paper's corresponding authors.`,
                paperId: paperId
            }, 
            { 
                id: authorId,
                name: 'author',
                displayName: 'Author',
                description: `One of this paper's authors.`,
                paperId: paperId
            }
        ])

        await this.permissionService.grant([
            { entity:'Paper', action:'update', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'Paper', action:'read', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'Paper', action:'delete', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'Paper', action:'grant', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'create', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'read', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'update', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'delete', roleId:correspondingAuthorId, paperId:paperId },
            { entity:'PaperVersion', action:'grant', roleId:correspondingAuthorId, paperId:paperId }
        ])

        await this.permissionService.grant([
            { entity:'Paper', action:'read', roleId:authorId, paperId:paperId },
            { entity:'PaperVersion', action:'create', roleId:authorId, paperId:paperId },
            { entity:'PaperVersion', action:'read', roleId:authorId, paperId:paperId }
        ])

        return { correspondingAuthorId: correspondingAuthorId, authorId: authorId }
    }

    async createJournalRoles(journalId, model) {
        const managingEditorId = Uuid.v4()
        const editorId = Uuid.v4()
        const memberId = Uuid.v4()

        const submissionEditorId = Uuid.v4()
        const submissionReviewerId = Uuid.v4()
        const submissionAuthorId = Uuid.v4()

        await this.roleDAO.insertRoles([
            { 
                id: managingEditorId,
                name: 'managing-editor',
                displayName: 'Managing Editor',
                description: 'A Managing Editor of this journal.',
                journalId: journalId
            },
            {
                id: editorId,
                name: 'editor',
                displayName: 'Editor',
                description: 'An Editor of this journal.',
                journalId: journalId
            },
            {
                id: memberId,
                name: 'member',
                displayName: 'Member',
                description: 'A Member of this journal team.',
                journalId: journalId
            },
            {
                id: submissionEditorId,
                name: 'submission-editor-template',
                displayName: 'Submission Editor Template',
                description: 'Editor assigned to a journal submission.',
                programmatic: true,
                journalId: journalId
            },
            {
                id: submissionReviewerId,
                name: 'submission-reviewer-template',
                displayName: 'Submission Reviewer Template',
                description: 'Reviewer assigned to a journal submission.',
                programattic: true,
                journalId: journalId
            },
            {
                id: submissionAuthorId,
                name: 'submission-author-template',
                displayName: 'Submission Author Template',
                description: 'Author of a journal submission.',
                programattic: true,
                journalId: journalId
            }
        ])

        if ( model == 'closed' ) {
            const publicId = await this.permissionService.getPublicRoleId()

            // == Public ==
            await this.permissionService.grant([
                { entity: 'Journal', action: 'read', roleId: publicId, journalId: journalId },
                { entity: 'Journal:submission', action: 'create', roleId: publicId, journalId: journalId },
                { entity: 'Journal:member', action: 'read', roleId: publicId, journalId: journalId },
            ])

            // == Managing Editor ==
            await this.permissionService.grant([
                { entity: 'Journal', action: 'read', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal', action: 'update', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal', action: 'delete', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal', action: 'grant', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission', action: 'read', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission', action: 'update', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission', action: 'delete', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission', action: 'grant', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:editor', action: 'create', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:editor', action: 'delete', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:reviewer', action: 'create', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:reviewer', action: 'delete', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:member', action: 'create', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:member', action: 'update', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:member', action: 'read', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:member', action: 'delete', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:member', action: 'grant', roleId: managingEditorId, journalId: journalId }
            ])

            // == Editor ==
            await this.permissionService.grant([
                { entity: 'Journal', action: 'read', roleId: editorId, journalId: journalId },
                { entity: 'Journal:member', action: 'read', roleId: editorId, journalId: journalId },
            ])

            // == Member ==
            await this.permissionService.grant([
                { entity: 'Journal', action: 'read', roleId: reviewerId, journalId: journalId },
                { entity: 'Journal:member', action: 'read', roleId: reviewerId, journalId: journalId },
            ])

            // == Submission Editor ==
            await this.permissionService.grant([
                { entity: 'Journal:submission', action: 'read', roleId: submissionEditorId, journalId: journalId },
                { entity: 'Journal:submission', action: 'update', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission', action: 'delete', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission', action: 'grant', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:editor', action: 'create', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:editor', action: 'delete', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:reviewer', action: 'create', roleId: managingEditorId, journalId: journalId },
                { entity: 'Journal:submission:reviewer', action: 'delete', roleId: managingEditorId, journalId: journalId },
            ])


        } else if ( model == 'open' ) {
            await this.assignOpenJournalPermissions(managingEditorId, editorId, memberId)
        }
    }

    /**
     * @return Promise<void>
     */
    async assignClosedJournalPermissions(managingEditorId, editorId, reviewerId) {
    }

    async assignOpenJournalPermissions(managingEditorId, editorId, reviewerId) {
        const publicId = await this.permissionService.getPublicRoleId()
        await this.permissionService.grant([
            { entity: 'Journal', action: 'read', roleId: publicId, journalId: journalId },
            { entity: 'Journal:submission', action: 'create', roleId: publicId, journalId: journalId },
            { entity: 'Journal:member', action: 'read', roleId: publicId, journalId: journalId },
        ])

        await this.permissionService.grant([
            { entity: 'Journal', action: 'read', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal', action: 'update', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal', action: 'delete', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal', action: 'grant', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'read', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'update', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'delete', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'grant', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'create', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'read', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'update', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'delete', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'grant', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'create', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'read', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'update', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'delete', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'grant', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:member', action: 'create', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:member', action: 'update', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:member', action: 'read', roleId: managingEditorId, journalId: journalId },
            { entity: 'Journal:member', action: 'delete', roleId: managingEditorId, journalId: journalId }
        ])

        await this.permissionService.grant([
            { entity: 'Journal', action: 'read', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'read', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'update', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'delete', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission', action: 'grant', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'create', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'read', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'update', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'delete', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:editor', action: 'grant', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'create', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'read', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'update', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'delete', roleId: editorId, journalId: journalId },
            { entity: 'Journal:submission:reviewer', action: 'grant', roleId: editorId, journalId: journalId },
            { entity: 'Journal:member', action: 'read', roleId: editorId, journalId: journalId },
        ])

        await this.permissionService.grant([
            { entity: 'Journal', action: 'read', roleId: reviewerId, journalId: journalId },
            { entity: 'Journal:member', action: 'read', roleId: reviewerId, journalId: journalId },
        ])
    }
}
     
