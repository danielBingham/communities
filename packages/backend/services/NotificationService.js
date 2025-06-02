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

const Handlebars = require('handlebars')

const GroupDAO = require('../daos/GroupDAO')
const GroupMemberDAO = require('../daos/GroupMemberDAO')
const NotificationDAO = require('../daos/NotificationDAO')
const PostDAO = require('../daos/PostDAO')
const PostCommentDAO = require('../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../daos/PostSubscriptionDAO')
const UserDAO = require('../daos/UserDAO')
const UserRelationshipDAO = require('../daos/UserRelationshipDAO')

const EmailService = require('./EmailService')
const PermissionService = require('./PermissionService')

const ServiceError = require('../errors/ServiceError')

module.exports = class NotificationService {


    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.notificationDAO = new NotificationDAO(core)
        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.emailService = new EmailService(core)
        this.permissionService = new PermissionService(core)

        this.notificationDefinitions = { 
            'Post:comment:create': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{commentAuthor.name}}} commented on your post "{{{postIntro}}}..."'), 
                    body: Handlebars.compile(`
Hi {{{postAuthor.name}}},

{{{commentAuthor.name}}} left a new comment on your post "{{{postIntro}}}...":

{{{comment.content}}}

Read the comment in context here: {{{host}}}{{{link}}}

Cheers,
The Communities Team
                        `)
                },
                text: Handlebars.compile(`{{{commentAuthor.name}}} commented, "{{{commentIntro}}}...", on your post, "{{{postIntro}}}...".`),
                path: Handlebars.compile(`/{{{link}}}`) 
            },
            'Post:comment:create:subscriber': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{commentAuthor.name}}} commented, "{{{commentIntro}}}", on a post, "{{{postIntro}}}...", you subscribe to, '), 
                    body: Handlebars.compile(`
Hi {{{subscriber.name}}},

{{{commentAuthor.name}}} left a new comment on a post by {{{postAuthor.name}}}, "{{{postIntro}}}...", you subscribe to:

"{{{comment.content}}}"

Read the comment in context here: {{{host}}}{{{link}}}

Cheers,
The Communities Team
                        `)
                },
                text: Handlebars.compile(`{{{commentAuthor.name}}} commented, "{{{commentIntro}}}...", on a post, "{{{postIntro}}}...", you subscribe to.`),
                path: Handlebars.compile(`/{{{link}}}`) 
            },
            'Post:comment:moderation:rejected': {
                email: {
                    subject: Handlebars.compile('[Communities] Your comment, "{{{commentIntro}}}...", was removed by Communities moderators. '), 
                    body: Handlebars.compile(`
Hi {{{commentAuthor.name}}},

Your comment, "{{{commentIntro}}}...", was removed by Communities moderators for
violating our terms of service.   

{{{ moderation.reason }}}

The original text of the comment was:

"{{{ comment.content }}}"

Please reread our terms and site moderation policies, as multiple violations
can result in a ban.

The Communities Team
                        `)
                },
                text: Handlebars.compile(`Communities moderators removed your comment, "{{{ commentIntro }}}..."`),
                path: Handlebars.compile(`/{{{link}}}`) 
            },
            'Post:moderation:rejected': {
                email: {
                    subject: Handlebars.compile('[Communities] Your post, "{{{postIntro}}}...", was removed by Communities moderators. '), 
                    body: Handlebars.compile(`
Hi {{{postAuthor.name}}},

Your post, "{{{postIntro}}}...", was removed by Communities moderators for
violating our terms of service.   

{{{ moderation.reason }}}

The original text of the post was:

"{{{ post.content }}}"

Please reread our terms and site moderation policies, as multiple violations
can result in a ban.

The Communities Team
                        `)
                },
                text: Handlebars.compile(`Communities moderators removed your post, "{{{postIntro}}}..."`),
                path: Handlebars.compile(`/{{{link}}}`) 
            },
            'User:friend:create': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{requester.name}}} sent you a Friend Request'),
                    body: Handlebars.compile(`
Hi {{{friend.name}}},

You have a new friend request on Communities from {{{requester.name}}}.

To accept, log in to your account and view your friend requests: {{{host}}}friends/requests

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{requester.name}}} sent you a friend request.`),
                path: Handlebars.compile(`/{{{requester.username}}}`)
            },
            'User:friend:update': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{friend.name}}} accepted your Friend Request'),
                    body: Handlebars.compile(`
Hi {{{requester.name}}},

{{{friend.name}}} accepted your friend request.

You can now view their profile here: {{{host}}}{{{friend.username}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{friend.name}}} accepted your friend request.`),
                path: Handlebars.compile(`/{{{friend.username}}}`)
            },
            'Group:member:create:invited': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{inviter.name}}} invited you to join group "{{{group.title}}}"'),
                    body: Handlebars.compile(`
Hi {{{user.name}}},

{{{inviter.name}}} invited you to join the {{{group.type}}} group, "{{{group.title}}}". 

You can view and accept or reject the invitation here: {{{host}}}group/{{{group.slug}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{inviter.name}}} invited you to join group "{{{group.title}}}"`),
                path: Handlebars.compile(`/group/{{{group.slug}}}`)
            },
            'Group:member:create:requested': {
                email: {
                    subject: Handlebars.compile('[Communities]  {{{user.name}}} asked to join group, "{{{group.title}}}"'),
                    body: Handlebars.compile(`
Hi {{{moderator.name}}},

{{{user.name}}} has asked to join the group, "{{{group.title}}}". 

You can view and accept or reject their request here: {{{host}}}group/{{{group.slug}}}/members

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{user.name}}} asked to join group "{{{group.title}}}"`),
                path: Handlebars.compile(`/group/{{{group.slug}}}/members`)

            },
            'Group:member:update:request:accepted': {
                email: {
                    subject: Handlebars.compile('[Communities] Your request to join group, "{{{group.title}}}" has been accepted!'),
                    body: Handlebars.compile(`
Hi {{{user.name}}},

Your request to join the group, "{{{group.title}}}" has been accepted.  You are now a mameber of "{{{group.title}}}". 

You can view and participate in the group here: {{{host}}}group/{{{group.slug}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`Your request to join group "{{{group.title}}}" has been accepted.`),
                path: Handlebars.compile(`/group/{{{group.slug}}}`)
            },
            'Group:member:update:promoted:moderator': {
                email: {
                    subject: Handlebars.compile('[Communities] You have been promoted to "moderator" of group, "{{{group.title}}}".'),
                    body: Handlebars.compile(`
Hi {{{user.name}}},

{{{promoter.name}}} has promoted you to the role of "moderator" of group, "{{{group.title}}}". You can now moderate posts, invite users, and approve requests to join.

You can view the group here: {{{host}}}group/{{{group.slug}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`You have been promoted to "moderator" of group "{{{group.title}}}".`),
                path: Handlebars.compile(`/group/{{{group.slug}}}`)
            },
            'Group:member:update:promoted:admin': {
                email: {
                    subject: Handlebars.compile('[Communities] You have been promoted to "admin" of group, "{{{group.title}}}".'),
                    body: Handlebars.compile(`
Hi {{{user.name}}},

{{{promoter.name}}} has promoted you to the role of "admin" of group, "{{{group.title}}}". You can now administrate the group. 

You can view the group here: {{{host}}}group/{{{group.slug}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`You have been promoted to "admin" of group "{{{group.title}}}".`),
                path: Handlebars.compile(`/group/{{{group.slug}}}`)
            },
            'Group:post:deleted': {
                email: {
                    subject: Handlebars.compile('[Communities] Your post, "{{{shortText}}}", was deleted from group, "{{{group.title}}}".'),
                    body: Handlebars.compile(`
Hi {{{user.name}}},

{{{moderator.name}}} deleted your post in group, "{{{group.title}}}".  The full text of the post was:

{{{post.content}}}

You can view the group here: {{{host}}}group/{{{group.slug}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{moderator.name}}} deleted your post, "{{{shortText}}}" in group, "{{{group.title}}}".`),
                path: Handlebars.compile(`/group/{{{group.slug}}}`)

            },
            'Group:post:comment:deleted': {
                email: {
                    subject: Handlebars.compile('[Communities] Your comment, "{{{shortText}}}", was deleted from a post in group, "{{{group.title}}}".'),
                    body: Handlebars.compile(`
Hi {{{user.name}}},

{{{moderator.name}}} deleted your comment from a post in group, "{{{group.title}}}".  The full text of your comment was:

{{{comment.content}}}

You can view the post here: {{{host}}}group/{{{group.slug}}}/{{{post.id}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{moderator.name}}} deleted your comment, "{{{shortText}}}" from a post in group, "{{{group.title}}}".`),
                path: Handlebars.compile(`/group/{{{group.slug}}}/{{{post.id}}}`)
            }
        }

        this.notificationMap = { 
            'Post:comment:create': this.sendNewCommentNotification.bind(this),
            'Post:comment:moderation:rejected': this.sendPostCommentModerationNotification.bind(this),
            'Post:moderation:rejected': this.sendPostModerationNotification.bind(this),
            'User:friend:create': this.sendFriendRequestNotification.bind(this),
            'User:friend:update': this.friendRequestAcceptedNotification.bind(this),
            'Group:member:create': this.sendGroupMemberCreatedNotification.bind(this),
            'Group:member:update': this.sendGroupMemberUpdatedNotification.bind(this),
            'Group:post:deleted': this.sendGroupPostDeletedNotification.bind(this),
            'Group:post:comment:deleted': this.sendGroupPostCommentDeletedNotification.bind(this)
        }
    }

    async sendNotifications(currentUser, type, context, options) {
        return await this.notificationMap[type](currentUser, context, options)
    }

    /**
     * Create a notification and send notification emails.  Different notifications
     * require different context.  See definitions above for the contexts requried
     * by each notification type.
     *
     * @param   {int}   userId  The `user.id` of the User we want to send the
     * notification to.
     * @param   {string}    type    The type of notification we want to send.
     * @see `notificationDefinitions`
     * @param   {Object}    context The contextual information necessary to
     * generate the notification content.  Differs per notification.type.  @see
     * `notificationDefinitions` for definition.
     * 
     */
    async createNotification(userId, type, context, options) {
        const definition = this.notificationDefinitions[type]
        if ( ! definition ) {
            throw new ServiceError('missing-definition',
                `Failed to find notification definitions for type '${type}'.`)
        }
       
        context.host = this.core.config.host

        const results = await this.core.database.query(`
            SELECT email, settings, status FROM users WHERE id = $1
        `, [ userId ])

        const settings = results.rows[0].settings
       
        // Use the default values if `type` isn't in their settings.
        let notificationSetting = {
            web: true,
            email: true,
            push: true
        }
        if ( type in settings.notifications ) {
            notificationSetting = settings.notifications[type]
        }

        // Only create the web notification if the user has web notifications
        // turned on for that notification.
        if ( notificationSetting.web && options?.noWeb !== true) {
            const notification = {
                userId: userId,
                type: type,
                description: definition.text(context),
                path: definition.path(context) 
            }
            await this.notificationDAO.insertNotification(notification)
        }

        // Only send the email if the user has emails turned on for that
        // notification.  Also, don't send notification emails to users that
        // have been invited but haven't accepted the invitation yet.
        if ( notificationSetting.email && options?.noEmail !== true && results.rows[0].status !== 'invited') {
            const email = results.rows[0].email

            await this.emailService.sendNotificationEmail(
                email, 
                definition.email.subject(context), 
                definition.email.body(context)
            )
        }
    }

    async sendNewCommentNotification(currentUser, context, options) {
        context.postIntro = context.post.content.substring(0,20)
        context.commentIntro = context.comment.content.substring(0,20)

        const postAuthor = await this.userDAO.getUserById(context.post.userId) 
        context.postAuthor = postAuthor

        if ( context.post.groupId ) {
            const group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}#comment-${context.comment.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}#comment-${context.comment.id}`
        }

        const subscriptions = await this.postSubscriptionDAO.getSubscriptionsByPost(context.post.id)
        if ( subscriptions !== null ) {
            const subscriberIds = subscriptions.map((s) => s.userId)
            const subscribers = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [ subscriberIds]})

            for(const subscription of subscriptions) {
                if ( subscription.userId == context.commentAuthor.id ) {
                    continue
                }

                if ( subscription.userId == postAuthor.id) {
                    await this.createNotification(postAuthor.id, 'Post:comment:create', context, options) 
                } else {
                    const subscriberContext = { ...context, subscriber: subscribers.dictionary[subscription.userId] }
                    await this.createNotification(subscription.userId, 'Post:comment:create:subscriber', subscriberContext, options)
                }
            }
        }
    }

    async sendPostCommentModerationNotification(currentUser, context, options) {
        if( ! ('postId' in context.moderation) 
            || context.moderation.postId === undefined 
            || context.moderation.postId === null 
        ) {
            throw new ServiceError('missing-context',
                `Moderation notification missing postId.`)
        }

        if ( ! ('postCommentId' in context.moderation) 
            || context.moderation.postCommentId === undefined 
            || context.moderation.postCommentId === null 
        ) {
            throw new ServiceError('missing-context',
                `Moderation notification missing postCommentId.`)
        }



        context.comment = await this.postCommentDAO.getPostCommentById(context.moderation.postCommentId)
        context.commentIntro = context.comment.content.substring(0,20)

        context.commentAuthor = await this.userDAO.getUserById(context.comment.userId) 

        context.post = await this.postDAO.getPostById(context.comment.postId)
        context.postAuthor = await this.userDAO.getUserById(context.post.userId)

        let group = null
        if ( context.post.groupId ) {
            group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}#comment-${context.comment.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}#comment-${context.comment.id}`
        }

        // Don't send notifications to user's who have lost the right to view
        // the post they commented on.
        const canViewPost = await this.permissionService.can(context.comment, 'view', 'Post', { post: context.post, group: group })
        if ( ! canViewPost ) {
            return
        }

        await this.createNotification(context.comment.userId, 'Post:comment:moderation:rejected', context, options) 
    }

    async sendPostModerationNotification(currentUser, context, options) {
        if( ! ('postId' in context.moderation) || context.moderation.postId === undefined || context.moderation.postId === null ) {
            throw new ServiceError('missing-context',
                `Moderation notification missing postId.`)
        }

        context.post = await this.postDAO.getPostById(context.moderation.postId)
        context.postIntro = context.post.content.substring(0,20)

        context.postAuthor = await this.userDAO.getUserById(context.post.userId) 

        let group = null
        if ( context.post.groupId ) {
            group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}`
        }

        // Don't send notifications to users who have lost the right to view
        // their post.
        const canViewPost = await this.permissionService.can(context.postAuthor, 'view', 'Post', { post: context.post, group: group })
        if ( ! canViewPost ) {
            return
        }

        await this.createNotification(context.postAuthor.id, 'Post:moderation:rejected', context, options) 
    }

    async sendFriendRequestNotification(currentUser, context, options) {
        const userResults = await this.userDAO.selectUsers({
            where: `users.id = ANY($1::uuid[])`,
            params: [  [ context.userId, context.relationId ] ]
        })

        context.friend = userResults.dictionary[context.relationId]
        context.requester = userResults.dictionary[context.userId]

        await this.createNotification(context.relationId, 'User:friend:create', context, options)
    }

    async friendRequestAcceptedNotification(currentUser, context, options) {
        const userResults = await this.userDAO.selectUsers({
            where: `users.id = ANY($1::uuid[])`,
            params: [  [ context.userId, context.relationId ] ]
        })

        context.friend = userResults.dictionary[context.relationId]
        context.requester = userResults.dictionary[context.userId]

        await this.createNotification(context.userId, 'User:friend:update', context, options)
    }

    async sendGroupMemberCreatedNotification(currentUser, context, options) {
        context.user = await this.userDAO.getUserById(context.member.userId)
        if ( context.member.status == 'pending-invited' ) {
            context.inviter = currentUser
            await this.createNotification(context.user.id, 'Group:member:create:invited', context, options)
        } else if ( context.member.status == 'pending-requested' ) {
            const moderatorResults = await this.groupMemberDAO.selectGroupMembers({
                where: `(group_members.role = 'admin' OR group_members.role = 'moderator') AND group_members.group_id = $1`,
                params: [ context.group.id ]
            })

            for(const id of moderatorResults.list ) {
                const moderatorMember = moderatorResults.dictionary[id]

                await this.createNotification(
                    moderatorMember.userId, 
                    'Group:member:create:requested', 
                    { ...context, moderator: moderatorMember },
                    options
                )
            }
        }
    }

    async sendGroupMemberUpdatedNotification(currentUser, context, options) {
        context.user = await this.userDAO.getUserById(context.member.userId)
        if ( context.previousStatus == 'pending-requested' && context.member.status == 'member' ) {
            await this.createNotification(
                context.user.id,
                'Group:member:update:request:accepted',
                context,
                options
            )
        } else if ( context.previousRole == 'member' && context.member.role == 'moderator' ) {
            await this.createNotification(
                context.user.id,
                'Group:member:update:promoted:moderator',
                { ...context, promoter: currentUser },
                options
            )
        } else if ( context.previousRole == 'moderator' && context.member.role == 'admin' ) {
            await this.createNotification(
                context.user.id,
                'Group:member:update:promoted:admin',
                { ...context, promoter: currentUser },
                options
            )

        }
    }


    async sendGroupPostDeletedNotification(currentUser, context, options) {
        context.user = await this.userDAO.getUserById(context.post.userId)
        context.group = await this.groupDAO.getGroupById(context.post.groupId)
        context.shortText = context.post.content.substring(0, 100) + '...'

        await this.createNotification(
            context.post.userId,
            'Group:post:deleted',
            context,
            options
        )
    }

    async sendGroupPostCommentDeletedNotification(currentUser, context, options) {
        context.user = await this.userDAO.getUserById(context.comment.userId)
        context.group = await this.groupDAO.getGroupById(context.post.groupId)
        context.shortText = context.comment.content.substring(0, 100) + '...'

        await this.createNotification(
            context.comment.userId,
            'Group:post:comment:deleted',
            context,
            options
        )

    }
}
