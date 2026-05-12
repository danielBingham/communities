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

const { util, schema } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class SiteModerationValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService

        this.siteModerationSchema = new schema.SiteModerationSchema()
    }

    async validateSiteModeration(currentUser, siteModeration, existing) {
        const errors = []

        if ( existing && siteModeration.id !== existing.id ) {
            throw new ServiceError('entity-mismatch',
                `Wrong 'existing' entity.`)
        }

        const validationErrors = this.siteModerationSchema.validate(siteModeration, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        // We're creating a moderation.
        if ( existing === null || existing === undefined ) {

            // You need at least one of these to create a SiteModeration.
            if ( ( ! util.objectHas(siteModeration, 'postId') ||  siteModeration.postId === null )
                && ( ! util.objectHas(siteModeration, 'postCommentId') || siteModeration.postCommentId === null )
                && ( ! util.objectHas(siteModeration, 'groupId') || siteModeration.groupId === null )
                && ( ! util.objectHas(siteModeration, 'userProfileId') || siteModeration.userProfileId === null ))

            {
                errors.push({
                    type: `entityId:missing`,
                    log: `SiteModeration missing ID of moderated entity.`,
                    message: `ID of the entity being moderated is required.  Please include one of 'postId', 'postCommentId', 'groupId', or 'userProfileId'.`
                })
            }

        } 
        // We're editing a moderation.
        else {

            if ( util.objectHas(siteModeration, 'postId') && siteModeration.postId !== existing.postId ) {
                errors.push({
                    type: `postId:not-allowed`,
                    log: `User(${currentUser.id}) attempting to change the SiteModeration.postId.`,
                    message: `You cannot edit SiteModeration.postId.`
                })
            }

            if ( util.objectHas(siteModeration, 'postCommentId') && siteModeration.postCommentId !== existing.postCommentId ) {
                errors.push({
                    type: `postCommentId:not-allowed`,
                    log: `User(${currentUser.id}) attempting to change SiteModeration.postCommentId.`,
                    message: `You cannot edit SiteModeration.postCommentId.`
                })
            }

            if ( util.objectHas(siteModeration, 'groupId') && siteModeration.groupId !== existing.groupId) {
                errors.push({
                    type: `groupId:not-allowed`,
                    log: `User(${currentUser.id}) attempting to change SiteModeration.groupId`,
                    message: `You cannot edit SiteModeration.groupId.`
                })
            }

            if ( util.objectHas(siteModeration, 'userProfileId') && siteModeration.userProfileId !== existing.userProfileId ) {
                errors.push({
                    type: `userProfileId:not-allowed`,
                    log: `User(${currentUser.id}) attempting to change SiteModeration.userProfileId`,
                    message: `You cannot edit SiteModeration.userProfileId.`
                })
            }
        }


        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        if ( util.objectHas(siteModeration, 'userId') ) {
            const results = await this.core.database.query(`SELECT id FROM users WHERE users.id = $1`, [ siteModeration.userId ])
            if ( results.rows.length <= 0 || results.rows[0].id !== siteModeration.userId) {
                errors.push({
                    type: 'userId:not-found',
                    log: `User(${currentUser.id}) submitted SiteModeration with invalid userId.`,
                    message: `We couldn't find a user for that userId.`
                })
            }
        }

        if ( util.objectHas(siteModeration, 'postId') ) {
            if ( siteModeration.postId !== null ) {
                const results = await this.core.database.query(`SELECT id FROM posts WHERE id = $1`, [ siteModeration.postId ]) 
                if ( results.rows.length <= 0 || results.rows[0].id !== siteModeration.postId) {
                    errors.push({
                        type: 'postId:not-found',
                        log: `Post not found for '${siteModeration.postId}'.`,
                        message: `Post not found for '${siteModeration.postId}'.`
                    })
                }
            }
        }

        if ( util.objectHas(siteModeration, 'postCommentId' ) ) {
            if ( siteModeration.postCommentId !== null ) {
                const postCommentResults = await this.core.database.query(
                    `SELECT id FROM post_comments WHERE id = $1`, 
                    [ siteModeration.postCommentId ]
                )
                if ( postCommentResults.rows.length <= 0 || postCommentResults.rows[0].id !== siteModeration.postCommentId) {
                    errors.push({
                        type: 'postCommentId:not-found',
                        log: `PostComment not found for '${siteModeration.postCommentId}'.`,
                        message: `PostComment not found for '${siteModeration.postCommentId}'.`
                    })
                }
            }
        }

        if ( util.objectHas(siteModeration, 'groupId' ) ) {
            if ( siteModeration.groupId !== null ) {
                const groupResults = await this.core.database.query(`SELECT id FROM groups WHERE id = $1`, [ siteModeration.groupId ])
                if ( groupResults.rows.length <= 0 || groupResults.rows[0].id !== siteModeration.groupId ) {
                    errors.push({
                        type: `groupId:not-found`,
                        log: `Group(${siteModeration.groupId}) not found.`,
                        message: `We couldn't find that Group.`
                    })
                }
            }
        }

        if ( util.objectHas(siteModeration, 'userProfileId') ) {
            if ( siteModeration.userProfileId !== null ) {
                const userProfileResults = await this.core.database.query(`SELECT id FROM users WHERE id = $1`, [ siteModeration.userProfileId ])
                if ( userProfileResults.rows.length <= 0 || userProfileResults.rows[0].id !== siteModeration.userProfileId ) {
                    errors.push({
                        type: `userId:not-found`,
                        log: `User(${siteModeration.userProfileId}) not found.`,
                        message: `We couldn't find that User.`
                    })
                }
            }
        }

        return errors

    }

}
