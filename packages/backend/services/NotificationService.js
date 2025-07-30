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

const path = require('path')
const fs = require('fs')

const Handlebars = require('handlebars')

const { lib } = require('@communities/shared')

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

const PostCommentNotifications = require('./notification/PostCommentNotifications')
const SiteModerationNotifications = require('./notification/SiteModerationNotifications')

const definitions = require('./notification/definitions')

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

        this.postCommentNotifications = new PostCommentNotifications(core, this)
        this.siteModerationNotifications = new SiteModerationNotifications(core, this)

        const layoutTemplate = fs.readFileSync(path.resolve(__dirname, './notification/definitions/layout.hbs'), 'utf8')
        Handlebars.registerPartial('layout', layoutTemplate)

        this.notificationDefinitions = { 
            'Post:mention': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{postAuthor.name}}} mentioned you in their post "{{{postIntro}}}..."'), 
                    body: Handlebars.compile(`
Hi {{{mentioned.name}}},

{{{postAuthor.name}}} mentioned you in their post "{{{postIntro}}}...".

Read the full post here: {{{host}}}{{{link}}}

Cheers,
The Communities Team
                        `)
                },
                text: Handlebars.compile(`{{{postAuthor.name}}} mentioned you in their post, "{{{postIntro}}}...".`),
                path: Handlebars.compile(`/{{{link}}}`) 

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
            'Group:post:moderation:rejected': {
                email: {
                    subject: Handlebars.compile('[Communities] Your post, "{{{postIntro}}}...", was removed by moderator of {{{group.title}}}. '), 
                    body: Handlebars.compile(`
Hi {{{postAuthor.name}}},

Your post, "{{{postIntro}}}...", was removed by moderators of {{{group.title}}} for violating the group's rules.   

{{{ moderation.reason }}}

The original text of the post was:

"{{{ post.content }}}"

The Communities Team
                        `)
                },
                text: Handlebars.compile(`Moderators of {{{group.title}}} removed your post, "{{{postIntro}}}..."`),
                path: Handlebars.compile(`/{{{link}}}`) 
            },
            'Group:post:comment:moderation:rejected': {
                email: {
                    subject: Handlebars.compile('[Communities] Your comment, "{{{commentIntro}}}...", was removed by moderators of {{{group.title}}}.'), 
                    body: Handlebars.compile(`
Hi {{{commentAuthor.name}}},

Your comment, "{{{commentIntro}}}...", was removed by moderators of {{{group.title}}} for violating the group's rules.  

{{{ moderation.reason }}}

The original text of the comment was:

"{{{ comment.content }}}"

The Communities Team
                        `)
                },
                text: Handlebars.compile(`Moderators of {{{group.title}}} removed your comment, "{{{ commentIntro }}}..."`),
                path: Handlebars.compile(`/{{{link}}}`) 
            }
        }

        this.notificationMap = { 
            'Post:mention': this.sendPostMentionNotification.bind(this),
            'Group:member:create': this.sendGroupMemberCreatedNotification.bind(this),
            'Group:member:update': this.sendGroupMemberUpdatedNotification.bind(this),
            'Group:post:moderation:rejected': this.sendGroupPostModerationRejectedNotification.bind(this),
            'Group:post:comment:moderation:rejected': this.sendGroupPostCommentModerationRejectedNotification.bind(this)
        }
    }

    async sendNotifications(currentUser, type, context, options) {
        const segments = type.split(':')

        const entity = segments[0]
        const action = segments[1]

        if ( entity === 'PostComment' ) {
            if ( action === 'create' ) {
                return await this.postCommentNotifications.create(currentUser, type, context, options)
            }
        } else if ( entity === 'SiteModeration' ) {
            if ( action === 'update' ) {
                return await this.siteModerationNotifications.update(currentUser, type, context, options)
            }
        } else if ( entity === 'UserRelatioship' ) {
            if ( action === 'create' ) {
                return await this.userRelationshipNotifications.create(currentUser, type, context, options)
            }
        }

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
        const definitionPath = type.split(':')

        // Walk down to the definition
        let definition = definitions
        for(const segment of definitionPath) {
            if ( segment in definition ) {
                definition = definition[segment]
            } else {
                throw new ServiceError('missing-definition',
                    `Failed to find notification definitions for type '${type}'. Segment '${segment}' missing.`)
            }
        }

        if ( definition === undefined || definition === null ) {
            throw new ServiceError('missing-definition',
                `Failed to find notification definitions for type '${type}'.`)
        } else if ( definition.type !== type ) {
            throw new ServiceError('wrong-type',
                `Got definition for type '${definition.type}' instead of '${type}'.`)
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
        if ('notifications' in settings && settings.notifications !== undefined && type in settings.notifications ) {
            notificationSetting = settings.notifications[type]
        }

        // Only create the web notification if the user has web notifications
        // turned on for that notification.
        if ( notificationSetting.web && options?.noWeb !== true) {
            const notification = {
                userId: userId,
                type: type,
                description: definition.web.text(context),
                path: definition.web.path(context) 
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

    async sendNewCommentNotifications(currentUser, context, options) {
        context.postIntro = context.post.content.substring(0,20)
        context.commentIntro = context.comment.content.substring(0,20)

        const postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 
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
            const subscribers = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [ subscriberIds], fields: ['status']})

            for(const subscription of subscriptions) {
                if ( subscription.userId == context.commentAuthor.id ) {
                    continue
                }

                // If the user has lost the ability to view this post, then don't send them a notification.
                const canViewPost = await this.permissionService.can(subscribers.dictionary[subscription.userId], 'view', 'Post', { post: context.post })
                if ( canViewPost !== true ) {
                    continue
                }

                if ( subscription.userId == postAuthor.id) {
                    await this.createNotification(postAuthor.id, 'Post:comment:create:author', context, options) 
                } else {
                    const subscriberContext = { ...context, subscriber: subscribers.dictionary[subscription.userId] }
                    await this.createNotification(subscription.userId, 'Post:comment:create:subscriber', subscriberContext, options)
                }
            }
        }
    }

    async sendPostCommentCreateMentionNotification(currentUser, context, options) {
        const mentionedUsernames = lib.mentions.parseMentions(context.comment.content)

        // No mentions to notify
        if ( mentionedUsernames.length <= 0 ) {
            return
        }

        context.commentIntro = context.comment.content.substring(0,20)
        context.postIntro = context.post.content.substring(0,20)
        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 

        if ( context.post.groupId ) {
            const group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}#comment-${context.comment.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}#comment-${context.comment.id}`
        }

        const userResults = await this.userDAO.selectUsers({
            where: `users.username = ANY($1::text[])`,
            params: [ mentionedUsernames ],
            fields: ['status']
        })

        // None of the mentions referred to real users.
        if ( userResults.list.length <= 0 ) {
            return
        }

        for(const userId of userResults.list ) {
            // If the user has lost the ability to view this post, then don't send them a notification.
            const canViewPost = await this.permissionService.can(userResults.dictionary[userId], 'view', 'Post', { post: context.post })
            if ( canViewPost !== true ) {
                continue
            }

            const mentionContext = { ...context, mentioned: userResults.dictionary[userId] }
            await this.createNotification(userId, 'Post:comment:create:mention', mentionContext, options)
        }
    }

    async sendPostMentionNotification(currentUser, context, options) {
        const mentionedUsernames = lib.mentions.parseMentions(context.post.content)

        // No mentions to notify
        if ( mentionedUsernames.length <= 0 ) {
            return
        }

        context.postIntro = context.post.content.substring(0,20)
        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 

        if ( context.post.groupId ) {
            const group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}`
        }

        const userResults = await this.userDAO.selectUsers({
            where: `users.username = ANY($1::text[])`,
            params: [ mentionedUsernames ],
            fields: ['status']
        })

        // None of the mentions referred to real users.
        if ( userResults.list.length <= 0 ) {
            return
        }

        for(const userId of userResults.list ) {
            // If the user has lost the ability to view this post, then don't send them a notification.
            const canViewPost = await this.permissionService.can(userResults.dictionary[userId], 'view', 'Post', { post: context.post })
            if ( canViewPost !== true ) {
                continue
            }

            const mentionContext = { ...context, mentioned: userResults.dictionary[userId] }
            await this.createNotification(userId, 'Post:mention', mentionContext, options)
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

        context.commentAuthor = await this.userDAO.getUserById(context.comment.userId, ['status']) 

        context.post = await this.postDAO.getPostById(context.comment.postId)
        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status'])

        let group = null
        if ( context.post.groupId ) {
            group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}#comment-${context.comment.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}#comment-${context.comment.id}`
        }

        // Don't send notifications to user's who have lost the right to view
        // the post they commented on.
        const canViewPost = await this.permissionService.can(context.commentAuthor, 'view', 'Post', { post: context.post, group: group })
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

        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 

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
        context.user = await this.userDAO.getUserById(context.member.userId, ['status'])
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
        context.user = await this.userDAO.getUserById(context.member.userId, ['status'])
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

    async sendGroupPostModerationRejectedNotification(currentUser, context, options) {
        if( ! ('postId' in context.moderation) || context.moderation.postId === undefined || context.moderation.postId === null ) {
            throw new ServiceError('missing-context',
                `Moderation notification missing postId.`)
        }

        context.post = await this.postDAO.getPostById(context.moderation.postId)
        context.postIntro = context.post.content.substring(0,20)

        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 

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
        if ( canViewPost !== true ) {
            return
        }

        await this.createNotification(context.postAuthor.id, 'Group:post:moderation:rejected', context, options) 
    }

    async sendGroupPostCommentModerationRejectedNotification(currentUser, context, options) {
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

        context.commentAuthor = await this.userDAO.getUserById(context.comment.userId, ['status']) 

        context.post = await this.postDAO.getPostById(context.comment.postId, ['status'])
        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status'])

        let group = null
        if ( context.post.groupId ) {
            group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}#comment-${context.comment.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}#comment-${context.comment.id}`
        }

        // Don't send notifications to user's who have lost the right to view
        // the post they commented on.
        const canViewPost = await this.permissionService.can(context.commentAuthor, 'view', 'Post', { post: context.post, group: group })
        if ( ! canViewPost ) {
            return
        }

        await this.createNotification(context.comment.userId, 'Group:post:comment:moderation:rejected', context, options) 
    }
}
