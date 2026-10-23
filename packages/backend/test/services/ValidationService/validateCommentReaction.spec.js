const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')

describe('ValidationService.validateCommentReaction()', function() {
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

    const userId = 'f5e9e853-6803-4a74-98c3-23fb0933062f'
    const postId = '62c7606b-5b1a-461a-99de-104743bd0342'
    const commentId = '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d'

    beforeEach(function() {
        core.database.query.mockReset()
        // Disable logging.
        core.logger.level = -1
    })

    it('Should return one error for each disallowed field included (createdDate, updatedDate)', async function() {
        const service = new ValidationService(core)

        const commentReaction = {
            postId: postId,
            commentId: commentId,
            userId: userId,
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        }

        const errors = await service.validateCommentReaction(null, commentReaction, null)

        expect(errors.length).toBe(2)
        expect(core.database.query).not.toHaveBeenCalled()
    })

    describe('when creating', function() {
        it('Should return one error for each required field (userId, postId, commentId, reaction) missing', async function() {
            const service = new ValidationService(core)

            const errors = await service.validateCommentReaction(null, {}, null)

            expect(errors.length).toBe(4)
        })

        it("Should only allow 'like' reactions", async function() {
            const service = new ValidationService(core)

            const commentReaction = {
                postId: postId,
                commentId: commentId,
                userId: userId,
                reaction: 'dislike'
            }

            const errors = await service.validateCommentReaction(null, commentReaction, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('reaction:invalid')
        })
    })

    describe('when editing', function() {
        it('Should throw an error when commentReaction.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary[userId]

            try {
                await service.validateCommentReaction(currentUser, { id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }, { id: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0' })
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })
    })

    describe('validate CommentReaction references', function() {
        it('Should pass a valid commentReaction', async function() {
            const service = new ValidationService(core)

            const commentReaction = {
                postId: postId,
                commentId: commentId,
                userId: userId,
                reaction: 'like'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: userId }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: postId }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: commentId, post_id: postId }] })

            const errors = await service.validateCommentReaction(entities.users.dictionary[userId], commentReaction, null)

            expect(errors.length).toBe(0)
        })

        it('Should return an error when the comment does not exist', async function() {
            const service = new ValidationService(core)

            const commentReaction = {
                postId: postId,
                commentId: commentId,
                userId: userId,
                reaction: 'like'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: userId }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: postId }] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const errors = await service.validateCommentReaction(entities.users.dictionary[userId], commentReaction, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('commentId:not-found')
        })

        it('Should return an error when the comment is on a different post', async function() {
            const service = new ValidationService(core)

            const commentReaction = {
                postId: postId,
                commentId: commentId,
                userId: userId,
                reaction: 'like'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: userId }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: postId }] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: commentId, post_id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

            const errors = await service.validateCommentReaction(entities.users.dictionary[userId], commentReaction, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('commentId:post-mismatch')
        })

        it('Should return an error when the user or post do not exist', async function() {
            const service = new ValidationService(core)

            const commentReaction = {
                postId: postId,
                commentId: commentId,
                userId: userId,
                reaction: 'like'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: commentId, post_id: postId }] })

            const errors = await service.validateCommentReaction(entities.users.dictionary[userId], commentReaction, null)

            expect(errors.length).toBe(2)
            expect(errors.map((e) => e.type).sort()).toEqual([ 'postId:not-found', 'userId:not-found' ])
        })
    })
})
