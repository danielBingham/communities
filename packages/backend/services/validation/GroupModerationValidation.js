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

const PermissionService = require ('../PermissionService')
const { util, validation } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupModerationValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService
        this.permissionService = new PermissionService(core)
    }

    async validateGroupModeration(currentUser, groupModeration, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== groupModeration.id ) {
            throw new ServiceError('entity-mismatch', 
                `Existing GroupModeration(${existing.id}) does not match GroupModeration(${groupModeration.id}).`)
        }

        // Do basic validation the fields.
        const validationErrors = validation.GroupModeration.validate(groupModeration, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // May not set both `postId` and `postCommentId`
        if ( util.objectHas(groupModeration, 'postId') && groupModeration.postId !== null 
            && util.objectHas(groupModeration, 'postCommentId') && groupModeration.postCommentId !== null ) 
        {
            errors.push({
                type: `postId:conflict`,
                log: `GroupModeration.postId and GroupModeration.postCommentId conflict.`,
                message: `You may not set both postId and postCommentId.`
            })

            errors.push({
                type: `postCommentId:conflict`,
                log: `GroupModeration.postId and GroupModeration.postCommentId conflict.`,
                message: `You may not set both postId and postCommentId.`
            })
        }

        if ( (! util.objectHas(groupModeration, 'postId') || groupModeration.postId === null )
            && ( ! util.objectHas(groupModeration, 'postCommentId') || groupModeration.postCommentId === null))
        {
            errors.push({
                type: `postId:required`,
                log: `Must include one of postId or postCommentId.`,
                message: `You must include one of postId or postCommentId.`
            })

            errors.push({
                type: `postCommentId:required`,
                log: `Must include one of postId or postCommentId.`,
                message: `You must include one of postId or postCommentId.`
            })
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // Validate relations.
        if ( util.objectHas(groupModeration, 'userId' ) && groupModeration.userId !== null) {
            const userResults = await this.core.database.query(`
                SELECT id FROM users WHERE id = $1
            `, [ groupModeration.userId ])

            if ( userResults.rows.length <= 0 || userResults.rows[0].id !== groupModeration.userId) {
                errors.push({
                    type: `userId:not-found`,
                    log: `User(${groupModeration.userId}) not found.`,
                    message: `User not found for that userId.`
                })
            }
        }

        if ( util.objectHas(groupModeration, 'groupId') && groupModeration.groupId !== null ) {
            const groupResults = await this.core.database.query(`
                SELECT id FROM groups WHERE id = $1
            `, [ groupModeration.groupId ])

            if ( groupResults.rows.length <= 0 || groupResults.rows[0].id !== groupModeration.groupId ) {
                errors.push({
                    type: `groupId:not-found`,
                    log: `Group(${groupModeration.groupId}) not found.`,
                    message: `Group not found for that groupId.`
                })
            }
        }

        if ( util.objectHas(groupModeration, 'postId' ) && groupModeration.postId !== null) {
            const postResults = await this.core.database.query(`
                SELECT id FROM posts WHERE id = $1
            `, [ groupModeration.postId ])

            if ( postResults.rows.length <= 0 || postResults.rows[0].id !== groupModeration.postId) {
                errors.push({
                    type: `postId:not-found`,
                    log: `Post(${groupModeration.postId}) not found.`,
                    message: `Post not found for that postId.`
                })
            }
        }

        if ( util.objectHas(groupModeration, 'postCommentId') && groupModeration.postCommentId !== null ) {
            const postCommentResults = await this.core.database.query(
                `SELECT id FROM post_comments WHERE id = $1`, 
                [ groupModeration.postCommentId ]
            )
            if ( postCommentResults.rows.length <= 0 || postCommentResults.rows[0].id !== groupModeration.postCommentId) {
                errors.push({
                    type: 'postCommentId:not-found',
                    log: `PostComment not found for '${groupModeration.postCommentId}'.`,
                    message: `PostComment not found for '${groupModeration.postCommentId}'.`
                })
            }
        }

        // Authorization Validation
        if( util.objectHas(groupModeration, 'status') && groupModeration.status !== null ) {
            const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { groupId: groupModeration.groupId })
            if ( groupModeration.status !== 'flagged' && canModerateGroup !== true ) {
                errors.push({
                    type: 'status:not-authorized',
                    log: `User attempting to moderate Group(${groupModeration.groupId}) without authorization.`,
                    message: `You do not have permission to moderate Communities.`
                })
            }
        }

        return errors
    }
}
