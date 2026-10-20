const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')

describe("CommentReactionPermissions.canUpdateCommentReaction()", function() {

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

    beforeEach(function() {
        core.database.query.mockReset()
        // Disable logging.
        core.logger.level = -1
    })

    it("Should not allow users to update other users' CommentReactions", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const commentReaction = {
            id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            commentId: '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d',
            userId: '3f69c43b-9ffc-4685-884a-99ac30629e93',
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const can = await service.can(currentUser, 'update', 'CommentReaction', { commentReaction: commentReaction })

        expect(can).toBe(false)
        expect(commentReaction.userId).not.toBe(currentUser.id)
    })

    it("Should allow users to update their own CommentReactions", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const commentReaction = {
            id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            commentId: '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const can = await service.can(currentUser, 'update', 'CommentReaction', { commentReaction: commentReaction })

        expect(can).toBe(true)
        expect(commentReaction.userId).toBe(currentUser.id)
    })

    it("Should load the CommentReaction from commentId and userId when it isn't in the context", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        core.database.query.mockReturnValue(undefined)
            .mockReturnValueOnce({ rowCount: 1, rows: [{
                CommentReaction_id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
                CommentReaction_postId: '703955d2-77df-4635-8ab8-b9108fef217f',
                CommentReaction_commentId: '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d',
                CommentReaction_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                CommentReaction_reaction: 'like',
                CommentReaction_createdDate: 'TIMESTAMP',
                CommentReaction_updatedDate: 'TIMESTAMP'
            }] })

        const context = { commentId: '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d', userId: currentUser.id }
        const can = await service.can(currentUser, 'update', 'CommentReaction', context)

        expect(can).toBe(true)
        expect(core.database.query).toHaveBeenCalledTimes(1)
        expect(context.commentReaction.id).toBe('78a6c6ce-4b4c-4c6b-b934-56886fd340a9')
    })

    it("Should throw a 'missing-context' ServiceError when the CommentReaction can't be found", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        core.database.query.mockReturnValue(undefined)
            .mockReturnValueOnce({ rowCount: 0, rows: [] })

        try {
            await service.can(currentUser, 'update', 'CommentReaction', { commentId: '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d', userId: currentUser.id })
        } catch (error) {
            expect(error).toBeInstanceOf(ServiceError)
            expect(error.type).toBe('missing-context')
        }

        expect.hasAssertions()
    })

    it("Should throw a 'context-mismatch' ServiceError when the CommentReaction isn't on the PostComment in the context", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const commentReaction = {
            id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            commentId: '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const postComment = {
            id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            userId: '3f69c43b-9ffc-4685-884a-99ac30629e93',
            content: 'Comment!'
        }

        try {
            await service.can(currentUser, 'update', 'CommentReaction', { postComment: postComment, commentReaction: commentReaction })
        } catch (error) {
            expect(error).toBeInstanceOf(ServiceError)
            expect(error.type).toBe('context-mismatch')
        }

        expect.hasAssertions()
    })
})
