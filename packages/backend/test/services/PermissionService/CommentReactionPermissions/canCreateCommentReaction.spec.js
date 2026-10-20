const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')

describe("CommentReactionPermissions.canCreateCommentReaction()", function() {

    const core = {
        logger: new Logger(),
        config: {
            s3: {
                bucket_url: '',
                access_id: '',
                access_key: '',
                bucket: ''
            },
        },
        database: {
            query: jest.fn()
        },
        queue: null,
        postmarkClient: {
            sendEmail: jest.fn()
        },
        features: new FeatureFlags()
    }

    const ME = '5c44ce06-1687-4709-b67e-de76c05acb6a'
    const OTHER = '3f69c43b-9ffc-4685-884a-99ac30629e93'
    const COMMENT_ID = '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d'

    const postCommentBy = function(userId) {
        return {
            id: COMMENT_ID,
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            userId: userId,
            content: 'Comment!',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }
    }

    beforeEach(function() {
        core.database.query.mockReset()
        // Disable logging.
        core.logger.level = -1
    })

    it("Should allow users to react to other users' comments (comment visibility is checked by the caller)", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary[ME]

        const can = await service.can(currentUser, 'create', 'CommentReaction', { postComment: postCommentBy(OTHER) })

        expect(can).toBe(true)
        expect(core.database.query).not.toHaveBeenCalled()
    })

    it("Should not allow users to react to their own comments", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary[ME]

        const can = await service.can(currentUser, 'create', 'CommentReaction', { postComment: postCommentBy(ME) })

        expect(can).toBe(false)
    })

    it("Should load the PostComment from commentId when it isn't in the context", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary[ME]

        core.database.query.mockReturnValue(undefined)
            .mockReturnValueOnce({ rowCount: 1, rows: [{
                PostComment_id: COMMENT_ID,
                PostComment_userId: ME,
                PostComment_postId: '703955d2-77df-4635-8ab8-b9108fef217f',
                PostComment_content: 'Comment!',
                PostComment_siteModerationId: null,
                PostComment_groupModerationId: null,
                PostComment_createdDate: 'TIMESTAMP',
                PostComment_updatedDate: 'TIMESTAMP'
            }] })

        const context = { commentId: COMMENT_ID }
        const can = await service.can(currentUser, 'create', 'CommentReaction', context)

        expect(can).toBe(false)
        expect(core.database.query).toHaveBeenCalledTimes(1)
        expect(context.postComment.userId).toBe(ME)
    })

    it("Should throw a 'missing-context' ServiceError when the PostComment can't be found", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary[ME]

        core.database.query.mockReturnValue(undefined)
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        try {
            await service.can(currentUser, 'create', 'CommentReaction', { commentId: COMMENT_ID })
        } catch (error) {
            expect(error).toBeInstanceOf(ServiceError)
            expect(error.type).toBe('missing-context')
        }

        expect.hasAssertions()
    })
})
