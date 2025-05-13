const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const PermissionService = require('../../../services/PermissionService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('PermissionService.canUpdatePost()', function() {

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

    describe('with context', function() {
        it('Should not look up the Post when the post is in the context', async function() {
            const service = new PermissionService(core)

            const context = {
                // Private post to a feed by Admin User
                post: entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f']
            }
           
            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const canUpdate = await service.canUpdatePost(currentUser, context)

            expect(canUpdate).toBe(true)
        })

        it("Should look up the Post when the post is not in the context", async function() {
            const service = new PermissionService(core)

            const context = {
                // Private post to a feed by Admin User
                postId: '703955d2-77df-4635-8ab8-b9108fef217f'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { ...database.posts[0] } ]})
           
            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const canUpdate = await service.canUpdatePost(currentUser, context)

            expect(canUpdate).toBe(true)
        })

        it("Should throw an error when `Post.id` and `postId` do not match", async function() {
            const service = new PermissionService(core)

            const context = {
                // Private post to a feed by Admin User
                post: entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f'],
                postId: '469931f6-26f2-4e1c-b4a0-849aed14e977'
            }
           
            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            try {
                const canUpdate = await service.canUpdatePost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:post')
            }

            expect.hasAssertions()
        })

        it("Should throw an error when Post is not provided", async function() {
            const service = new PermissionService(core)

            const context = { }
           
            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            try {
                const canUpdate = await service.canUpdatePost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('missing-context')
            }

            expect.hasAssertions()
        })

        it("Should throw an error when Post does not exist", async function() {
            const service = new PermissionService(core)

            const context = { 
                postId: 'cb346c98-87c6-4b3e-8ac4-31111b9c723a'
            }
           
            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [ ]})

            try {
                const canUpdate = await service.canUpdatePost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('missing-context')
            }

            expect.hasAssertions()
        })
    })

    describe("for a feed post", function() {

        it("Should allow a user to update their own post", async function() {
            const service = new PermissionService(core)

            const post = entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f']
            const context = {
                // Private post to a feed by Admin User
                post: post 
            }

            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const canUpdate = await service.canUpdatePost(currentUser, context)

            expect(post.userId).toBe(currentUser.id)
            expect(canUpdate).toBe(true)
        })

        it("Should not allow a user to update another user's post", async function() {
            const service = new PermissionService(core)

            const post = entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f']
            const context = {
                // Private post to a feed by Admin User
                post: post 
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canUpdate = await service.canUpdatePost(currentUser, context)

            expect(post.userId).not.toBe(currentUser.id)
            expect(canUpdate).toBe(false)
        })
    })
})
