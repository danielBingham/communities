const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe('PermissionService.canDeletePost()', function() {

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

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(canDelete).toBe(true)
        })

        it("Should look up the Post when the post is not in the context", async function() {
            const service = new PermissionService(core)

            const context = {
                // Private post to a feed by Admin User
                postId: '703955d2-77df-4635-8ab8-b9108fef217f'
            }

            const postRows = database.posts['703955d2-77df-4635-8ab8-b9108fef217f'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: postRows.length, rows: postRows })
           
            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(canDelete).toBe(true)
        })

        it("Should not look up the GroupMember for a post in a Group when GroupMember is in the context", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User
            const post = entities.posts.dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            // User One moderator membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['30d5291a-8df7-4c82-9508-ffa78a00217b']

            const context = {
                post: post,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(post.userId).not.toBe(currentUser.id)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('moderator')
            expect(canDelete).toBe(true)
        })

        it("Should look up the GroupMember for a post in a Group when the GroupMember is not in the context", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User
            const post = entities.posts.dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            const context = {
                post: post
            }

            // User One moderator membership in Test Private Group
            const groupMemberRows = database.groupMembers['30d5291a-8df7-4c82-9508-ffa78a00217b'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: groupMemberRows.length, rows: groupMemberRows })

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(post.userId).not.toBe(currentUser.id)
            expect(canDelete).toBe(true)

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
                const canDelete = await service.canDeletePost(currentUser, context)
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
                const canDelete = await service.canDeletePost(currentUser, context)
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
                const canDelete = await service.canDeletePost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('missing-context')
            }

            expect.hasAssertions()
        })

        it("Should throw an error when groupId does not equal post.groupId", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User
            const post = entities.posts.dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            // User One member membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                post: post,
                groupMember: groupMember,
                groupId: '47f85604-b4b1-4564-8e3c-246272e73c68'
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canDelete = await service.canDeletePost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:post')
            }

            expect.hasAssertions()
        })

        it("Should throw an error when groupMember.groupId does not equal post.groupId", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User
            const post = entities.posts.dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            // User One member membership in Test Open Group
            const groupMember = entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9']

            const context = {
                post: post,
                groupMember: groupMember,
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canDelete = await service.canDeletePost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:groupMember')
            }

            expect.hasAssertions()
        })
    })

    describe("for a feed post", function() {

        it("Should allow a user to delete their own post", async function() {
            const service = new PermissionService(core)

            const post = entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f']
            const context = {
                // Private post to a feed by Admin User
                post: post 
            }

            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(post.userId).toBe(currentUser.id)
            expect(canDelete).toBe(true)
        })

        it("Should not allow a user to delete another user's post", async function() {
            const service = new PermissionService(core)

            const post = entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f']
            const context = {
                // Private post to a feed by Admin User
                post: post 
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(post.userId).not.toBe(currentUser.id)
            expect(canDelete).toBe(false)
        })
    })

    describe("for a group post", function() {
        it("Should allow a GroupMember with role 'moderator' to delete the post", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User
            const post = entities.posts.dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            // User One moderator membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['30d5291a-8df7-4c82-9508-ffa78a00217b']

            const context = {
                post: post,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(post.userId).not.toBe(currentUser.id)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('moderator')
            expect(canDelete).toBe(true)
        })

        it("Should allow a GroupMember with role 'admin' to delete the post", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User
            const post = entities.posts.dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            // User One admin membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['a1c5361e-3e46-435b-bab4-0a74ddbd79e2']

            const context = {
                post: post,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(post.userId).not.toBe(currentUser.id)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('admin')
            expect(canDelete).toBe(true)
        })

        it("Should not allow a GroupMember who isn't an author to delete the post", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User
            const post = entities.posts.dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            // User One member membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                post: post,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.canDeletePost(currentUser, context)

            expect(post.userId).not.toBe(currentUser.id)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('member')
            expect(canDelete).toBe(false)
        })
    })
})
