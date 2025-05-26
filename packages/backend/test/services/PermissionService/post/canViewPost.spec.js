const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe('PermissionService.canViewPost()', function() {

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

            const user = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const context = {
                post: entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f']
            }

            const canView = await service.canViewPost(user, context)

            expect(canView).toBe(true)
        })

        it('Should look up the Post when it has postId in context', async function() {
            const service = new PermissionService(core)

            const user = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const context = {
                postId: '703955d2-77df-4635-8ab8-b9108fef217f'
            }

            const postRows = database.posts['703955d2-77df-4635-8ab8-b9108fef217f'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: postRows.length, rows: postRows })

            const canView = await service.canViewPost(user, context)

            expect(canView).toBe(true)
        })

        it("Should throw an error if Post and postId are both in context and don't match", async function() {
            const service = new PermissionService(core)

            const post = entities['posts'].dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            const context = {
                post: post,
                postId: 'e792718e-6730-438e-85f7-a5172af3d740'
            }

            const postRows = database.posts['703955d2-77df-4635-8ab8-b9108fef217f'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: postRows.length, rows: postRows })

            // Admin User
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            try {
                const canView = await service.canViewPost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:post')
            }

            expect.hasAssertions()

        })

        it('Should not look up the Group if it has it in the context', async function() {
            const service = new PermissionService(core)

            const post = entities['posts'].dictionary['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de']
            const user = entities['users'].dictionary[post.userId]
            const group = entities['groups'].dictionary[post.groupId]

            const context = {
                post: post, 
                group: group,
            }

            const canView = await service.canViewPost(user, context)

            expect(post.groupId).toBe(group.id)
            expect(user.id).toBe(post.userId)
            expect(canView).toBe(true)
        })

        it('Should look up the Group when it does not have it in context', async function() {
            const service = new PermissionService(core)

            const post = entities['posts'].dictionary['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de']
            const user = entities['users'].dictionary[post.userId]

            const context = {
                post: post
            }

            const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            const canView = await service.canViewPost(user, context)

            expect(post.userId).toBe(user.id)
            expect(canView).toBe(true)

        })

        it("Should throw an error when Group is in context and `Group.id` does not equal `Post.groupId`", async function() {
            const service = new PermissionService(core)

            // Public post to an Test Open Group by Admin User 
            const post = entities['posts'].dictionary['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de']
            // Test Private Group
            const group = entities['groups'].dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

            const context = {
                post: post, 
                group: group,
            }

            const postRows = database.posts['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: postRows.length, rows: postRows })

            // User Two
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            try {
                const canView = await service.canViewPost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:group')
            }

            expect.hasAssertions()
        })

        it("Should throw an error when `groupId` is in context and `groupId` does not equal `Post.groupId`", async function() {
            const service = new PermissionService(core)

            // Public post to an Test Open Group by Admin User 
            const post = entities['posts'].dictionary['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de']

            const context = {
                post: post, 
                // Test Private Group
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f'
            }

            const postRows = database.posts['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: postRows.length, rows: postRows })

            // User Two
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            try {
                const canView = await service.canViewPost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:groupId')
            }

            expect.hasAssertions()
        })

        it('Should not look up the GroupMember if it has it in the context', async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by User Two. 
            const post = entities['posts'].dictionary['e9f73a4a-bdaa-4633-9a8e-bea636f651a1']
            // User Two.
            const user = entities['users'].dictionary[post.userId]
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Private Group.
            const groupMember = entities['groupMembers'].dictionary['70f2c9ee-e614-4bb0-bed0-83b42d1b37cd']

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            const canView = await service.canViewPost(user, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('private')
            expect(groupMember.groupId).toBe(group.id)
            expect(groupMember.userId).toBe(user.id)
            expect(canView).toBe(true)
        })

        it('Should look up the GroupMember if it is not in the context', async function() {
            const service = new PermissionService(core)

            // Private post to a Test Private Group by Admin User.
            const post = entities['posts'].dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']
            
            // Test Private Group 
            const group = entities['groups'].dictionary[post.groupId]

            const context = {
                post: post, 
                group: group,
            }

            // User One 'member' membership in Test Private Group
            const groupMemberRows = database.groupMembers['0e1555d1-bccd-465d-85bc-4e3dbd4d29db'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: groupMemberRows.length, rows: groupMemberRows })

            // User One
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.title).toBe('Test Private Group')
            expect(group.type).toBe('private')
            expect(currentUser.name).toBe('User One')
            expect(groupMemberRows[0].GroupMember_groupId).toBe(group.id)
            expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
            expect(canView).toBe(true)
        })

        it("Should throw an error when GroupMember is in context and `GroupMember.groupId` does not equal `Group.groupId`", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by User Two. 
            const post = entities['posts'].dictionary['e9f73a4a-bdaa-4633-9a8e-bea636f651a1']
            // User Two.
            const user = entities['users'].dictionary[post.userId]
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Private Group.
            const groupMember = entities['groupMembers'].dictionary['79104b92-46c7-4e01-88f0-b9f261ecaf78']

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Two
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            try {
                const canView = await service.canViewPost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:groupMember')
            }

            expect.hasAssertions()
        })

        it("Should throw an error when GroupMember is in context and `GroupMember.userId` does not equal `currentUser.id`", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by User Two. 
            const post = entities['posts'].dictionary['e9f73a4a-bdaa-4633-9a8e-bea636f651a1']
            // User Two.
            const user = entities['users'].dictionary[post.userId]
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Private Group.
            const groupMember = entities['groupMembers'].dictionary['70f2c9ee-e614-4bb0-bed0-83b42d1b37cd']

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Three 
            const currentUser = entities['users'].dictionary['cd33814b-2381-4b55-b108-3395b8866792']

            try {
                const canView = await service.canViewPost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:groupMember')
            }

            expect.hasAssertions()
        })

        it('Should not look up the UserRelationship if it is in the context', async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            const userRelationship = entities.userRelationships.dictionary['8fc429cc-aec4-4cc8-8394-f2aa3f7c125c']

            const context = {
                post: post, 
                userRelationship: userRelationship
            }

            // User One
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(userRelationship.userId).toBe(post.userId)
            expect(userRelationship.relationId).toBe(currentUser.id)
            expect(canView).toBe(true)
        })

        it('Should look up the UserRelationship if it is not in the context', async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            const context = {
                post: post
            }

            const userRelationshipRows = database.userRelationships['8fc429cc-aec4-4cc8-8394-f2aa3f7c125c'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: userRelationshipRows.length, rows: userRelationshipRows })

            // User One
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(canView).toBe(true)
        })

        it("Should throw an error when UserRelationship is in context and doesn't match currentUser", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            // Confirmed relationship between Admin User and User Two
            const userRelationship = entities.userRelationships.dictionary['7dac4233-3605-4abd-8528-21f15c4e4126']

            const context = {
                post: post, 
                userRelationship: userRelationship
            }

            // User One
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canView = await service.canViewPost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:userRelationship')
            }

            expect.hasAssertions()
        })

        it("Should throw an error when UserRelationship is in context and doesn't match `Post.userId`", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            // Confirmed relationship between User Two and User One 
            const userRelationship = entities.userRelationships.dictionary['5c03d0d2-da31-44c2-9a50-1ae524c23c1d']

            const context = {
                post: post, 
                userRelationship: userRelationship
            }

            // User One
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canView = await service.canViewPost(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:userRelationship')
            }

            expect.hasAssertions()
        })
    })

    describe('for posts to a feed', function() {

        it("Should return `true` if `user` is trying to view their own `post`", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            const context = {
                post: post 
            }

            // Admin User 
            const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(post.userId).toBe(currentUser.id)
            expect(canView).toBe(true)

        })

        it("Should return `true` if `user` is trying to view a public `post`", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['e792718e-6730-438e-85f7-a5172af3d740']

            const context = {
                post: post 
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('public')
            expect(post.userId).not.toBe(currentUser.id)
            expect(canView).toBe(true)
        })

        it("Should return `true` if `user` is trying to view a friend's private `post`", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            // Relationship between Admin User and User One
            const userRelationship = entities.userRelationships.dictionary['8fc429cc-aec4-4cc8-8394-f2aa3f7c125c']

            const context = {
                post: post, 
                userRelationship: userRelationship
            }

            // User One
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(userRelationship.userId).toBe(post.userId)
            expect(userRelationship.relationId).toBe(currentUser.id)
            expect(canView).toBe(true)
        })

        it("Should return `true` if `user` is trying to view a friend's private `post`, relationship order should not matter", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            // Relationship between User Two and Admin User
            const userRelationship = entities.userRelationships.dictionary['7dac4233-3605-4abd-8528-21f15c4e4126']

            const context = {
                post: post, 
                userRelationship: userRelationship
            }

            // User Two
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(userRelationship.relationId).toBe(post.userId)
            expect(userRelationship.userId).toBe(currentUser.id)
            expect(canView).toBe(true)
        })

        it("Should return `false` if `user` is trying to view private `post` of non-friend", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            const context = {
                post: post 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [ ]})

            // User One
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(post.userId).not.toBe(currentUser.id)
            expect(canView).toBe(false)
        })

        it("Should return `false` if `user` is trying to view private `post` of 'pending' friend", async function() {
            const service = new PermissionService(core)

            // Private post to a feed by Admin User. 
            const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

            // Relationship between User three and Admin User
            const userRelationship = entities.userRelationships.dictionary['42c63d92-dfbb-44a3-b5ba-eb6374f73c72']

            const context = {
                post: post, 
                userRelationship: userRelationship
            }

            // User Three 
            const currentUser = entities['users'].dictionary['cd33814b-2381-4b55-b108-3395b8866792']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(userRelationship.relationId).toBe(post.userId)
            expect(userRelationship.userId).toBe(currentUser.id)
            expect(userRelationship.status).toBe('pending')
            expect(canView).toBe(false)
        })
    })

    describe('for posts to a group', function() {
        it("Should return `true` if `post` is to an open Group", async function() {
            const service = new PermissionService(core)

            // Public post to Test Open Group by Admin User 
            const post = entities['posts'].dictionary['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de']
            // Test Open Group.
            const group = entities['groups'].dictionary[post.groupId]

            const context = {
                post: post, 
                group: group,
            }

            // User Three 
            const currentUser = entities['users'].dictionary['cd33814b-2381-4b55-b108-3395b8866792']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('public')
            expect(group.type).toBe('open')
            expect(canView).toBe(true)
        })

        it("Should return `true` if `post` is to a private Group and currentUser is a member", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Private Group.
            const groupMember = entities['groupMembers'].dictionary['70f2c9ee-e614-4bb0-bed0-83b42d1b37cd']

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('private')
            expect(groupMember.groupId).toBe(group.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(canView).toBe(true)
        })

        it("Should return `true` if `post` is to a hidden Group and currentUser is a member", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['832d3206-d6f3-4ed4-9028-8ef2045485a3']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Hidden Group.
            const groupMember = entities['groupMembers'].dictionary['79104b92-46c7-4e01-88f0-b9f261ecaf78']

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('hidden')
            expect(groupMember.groupId).toBe(group.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(canView).toBe(true)
        })

        it("Should return `false` if `post` is to a private Group and currentUser is not a member", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]

            const context = {
                post: post, 
                group: group
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [ ]})

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('private')
            expect(canView).toBe(false)

        })

        it("Should return `false` if `post` is to a hidden Group and currentUser is a not member", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['832d3206-d6f3-4ed4-9028-8ef2045485a3']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]

            const context = {
                post: post, 
                group: group
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [ ]})

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('hidden')
            expect(canView).toBe(false)
        })

        it("Should return `false` if `post` is to a private Group and currentUser is an invited member", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Private Group.
            const groupMember = { ...entities['groupMembers'].dictionary['70f2c9ee-e614-4bb0-bed0-83b42d1b37cd'] }
            groupMember.status = 'pending-invited'

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('private')
            expect(groupMember.groupId).toBe(group.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(canView).toBe(false)
        })

        it("Should return `false` if `post` is to a hidden Group and currentUser is an invited member", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['832d3206-d6f3-4ed4-9028-8ef2045485a3']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Hidden Group.
            const groupMember = { ...entities['groupMembers'].dictionary['79104b92-46c7-4e01-88f0-b9f261ecaf78'] }
            groupMember.status = 'pending-invited'

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('hidden')
            expect(groupMember.groupId).toBe(group.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(canView).toBe(false)
        })

        it("Should return `false` if `post` is to a private Group and currentUser has requested membership", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Private Group.
            const groupMember = { ...entities['groupMembers'].dictionary['70f2c9ee-e614-4bb0-bed0-83b42d1b37cd'] }
            groupMember.status = 'pending-requested'

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('private')
            expect(groupMember.groupId).toBe(group.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(canView).toBe(false)
        })

        it("Should return `false` if `post` is to a hidden Group and currentUser has requested membership", async function() {
            const service = new PermissionService(core)

            // Private post to Test Private Group by Admin User. 
            const post = entities['posts'].dictionary['832d3206-d6f3-4ed4-9028-8ef2045485a3']
            // Test Private Group.
            const group = entities['groups'].dictionary[post.groupId]
            // User Two's membership in Test Hidden Group.
            const groupMember = { ...entities['groupMembers'].dictionary['79104b92-46c7-4e01-88f0-b9f261ecaf78'] }
            groupMember.status = 'pending-requested'

            const context = {
                post: post, 
                group: group,
                groupMember: groupMember
            }

            // User Two 
            const currentUser = entities['users'].dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const canView = await service.canViewPost(currentUser, context)

            expect(post.visibility).toBe('private')
            expect(group.type).toBe('hidden')
            expect(groupMember.groupId).toBe(group.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(canView).toBe(false)
        })
    })
})
