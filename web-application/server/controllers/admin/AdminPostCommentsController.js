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

const Uuid = require('uuid')

const { 
    NotificationService, 
    PermissionService, 
    ValidationService,

    GroupSubscriptionDAO,
    PostDAO, 
    PostCommentDAO, 
    PostSubscriptionDAO,
    SiteModerationDAO,
    UserRelationshipDAO 

} = require('@communities/backend')

const ControllerError = require('../../errors/ControllerError')

module.exports = class AdminPostCommentsController {

    constructor(core) {
        this.core = core

        this.groupSubscriptionDAO = new GroupSubscriptionDAO(core)
        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.siteModerationDAO = new SiteModerationDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        const relations = {}

        // -------- Post ------------------------------------------------------
        const postIds = []
        for(const commentId of results.list) {
            postIds.push(results.dictionary[commentId].postId)
        }

        const postResults = await this.postDAO.selectPosts({
            where: 'posts.id = ANY($1::uuid[])',
            params: [ postIds ]
        })
        relations.posts = postResults.dictionary

        // -------- PostSubscription ------------------------------------------
        const postSubscriptionResults = await this.postSubscriptionDAO.selectPostSubscriptions({
            where: 'post_subscriptions.user_id = $1 AND post_subscriptions.post_id = ANY($2::uuid[])',
            params: [ currentUser.id, postIds ]
        })
        relations.postSubscriptions = postSubscriptionResults.dictionary

        // -------- SiteModeration --------------------------------------------
        const siteModerationResults = await this.siteModerationDAO.selectSiteModerations({
            where: `site_moderation.post_comment_id = ANY($1::uuid[])`,
            params: [ results.list ]
        })
        relations.siteModerations = siteModerationResults.dictionary

        return relations
    }

    async getPostComments(request, response) {
        const currentUser = request.session.user
        const userId = request.params.userId

        if ( ! currentUser ) {
            throw new ControllerError(404, 'no-resource',
                `Unauthenticated user attempting to access admin endpoint.`,
                `Request for a non-existent resource.`)
        }

        const canModerateSite = await this.permissionService.can(currentUser, 'moderate', 'Site')
        if ( canModerateSite !== true) {
            throw new ControllerError(404, 'no-resource',
                `User(${currentUser.id}) doesn't have permission to moderate the site.`,
                `Request for a non-existent resource.`)
        }

        let page = 1
        if ( 'page' in request.query ) {
            page = parseInt(request.query.page, 10)
        }

        const commentResults = await this.postCommentDAO.selectPostComments({
            where: `post_comments.user_id = $1`,
            params: [ userId],
            page: page 
        })

        const meta = await this.postCommentDAO.getPostCommentPageMeta({
            where: `post_comments.user_id = $1`,
            params: [ userId],
            page: page
        })

        const relations = await this.getRelations(currentUser, commentResults)

        response.status(200).json({
            dictionary: commentResults.dictionary,
            list: commentResults.list,
            meta: meta,
            relations: relations
        })
    }
}
