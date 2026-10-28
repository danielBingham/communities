const Logger = require('../../../logger')
const PostCommentNotifications = require('../../../services/notification/entities/PostCommentNotifications')

describe('PostCommentNotifications', function() {

    const users = {
        'commenter': { id: 'commenter', username: 'commenter', status: 'confirmed' },
        'postAuthor': { id: 'postAuthor', username: 'postAuthor', status: 'confirmed' },
        'cannotView': { id: 'cannotView', username: 'cannotView', status: 'confirmed' },
        'canView1': { id: 'canView1', username: 'canView1', status: 'confirmed' },
        'canView2': { id: 'canView2', username: 'canView2', status: 'confirmed' }
    }

    // `cannotView` is first, so that we can confirm the users after them are
    // still notified.
    const recipients = [ 'cannotView', 'canView1', 'canView2' ]

    const getNotifications = function() {
        const logger = new Logger()
        logger.level = -1
        const core = { logger: logger, config: { host: 'https://localhost:3000' } }

        const notificationWorker = { createNotification: jest.fn(async () => {}) }
        const notifications = new PostCommentNotifications(core, notificationWorker)

        // `cannotView` can see the post, but not the comment.
        notifications.permissionService = {
            can: jest.fn(async (user, action, entity) => ! ( entity === 'PostComment' && user.id === 'cannotView' ))
        }

        notifications.userDAO = {
            selectUsers: jest.fn(async () => ({
                list: [ ...recipients ],
                dictionary: Object.fromEntries(recipients.map((id) => [ id, users[id] ]))
            }))
        }

        notifications.postSubscriptionDAO = {
            getSubscriptionsByPost: jest.fn(async () => recipients.map((id) => ({ postId: 'post', userId: id })))
        }

        return [ notifications, notificationWorker ]
    }

    const getContext = function() {
        return {
            post: { id: 'post', userId: 'postAuthor', content: 'A post.' },
            comment: { id: 'comment', postId: 'post', userId: 'commenter', content: '@cannotView @canView1 @canView2 Hello!' },
            commentAuthor: users['commenter'],
            postAuthor: users['postAuthor'],
            mentionedUsernames: [ ...recipients ]
        }
    }

    const notifiedUserIds = function(notificationWorker) {
        return notificationWorker.createNotification.mock.calls.map((call) => call[0])
    }

    describe('createMention()', function() {
        it('Should keep notifying mentioned users after one who cannot view the comment', async function() {
            const [ notifications, notificationWorker ] = getNotifications()

            await notifications.createMention(users['commenter'], 'PostComment:create', getContext(), {})

            expect(notifiedUserIds(notificationWorker)).toEqual([ 'canView1', 'canView2' ])
            for(const call of notificationWorker.createNotification.mock.calls) {
                expect(call[1]).toBe('PostComment:create:mention')
            }
        })
    })

    describe('createSubscriber()', function() {
        it('Should keep notifying subscribers after one who cannot view the comment', async function() {
            const [ notifications, notificationWorker ] = getNotifications()

            await notifications.createSubscriber(users['commenter'], 'PostComment:create:subscriber', getContext(), {})

            expect(notifiedUserIds(notificationWorker)).toEqual([ 'canView1', 'canView2' ])
            for(const call of notificationWorker.createNotification.mock.calls) {
                expect(call[1]).toBe('PostComment:create:subscriber')
            }
        })
    })
})
