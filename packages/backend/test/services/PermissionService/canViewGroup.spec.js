const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const PermissionService = require('../../../services/PermissionService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('PermissionService.canViewGroup()', function() {

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
        it("Should not look up Group or GroupMember when they are in context", async function() {
            const service = new PermissionService(core)

            // Test Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

            // User One membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                group: group,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewGroup(currentUser, context)

            expect(group.id).toBe(groupMember.groupId)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('member')
            expect(canView).toBe(true)
        })

        it("Should look up Group when not in context", async function() {
            const service = new PermissionService(core)

            // User One membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                groupMember: groupMember
            }

            const groupRows = database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows})

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewGroup(currentUser, context)

            expect(context.groupId).toBe(groupMember.groupId)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('member')
            expect(canView).toBe(true)
        })

        it("Should look up GroupMember when not in context", async function() {
            const service = new PermissionService(core)

            // Test Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']


            const context = {
                group: group
            }

            const groupMemberRows = database.groupMembers['0e1555d1-bccd-465d-85bc-4e3dbd4d29db'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: groupMemberRows, rows: groupMemberRows})

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canView = await service.canViewGroup(currentUser, context)

            expect(groupMemberRows[0].GroupMember_groupId).toBe(group.id)
            expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
            expect(groupMemberRows[0].GroupMember_status).toBe('member')
            expect(canView).toBe(true)
        })

        it("Should throw an error if group and groupId do not match", async function() {
            const service = new PermissionService(core)

            // Test Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

            // User One membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                groupId: '0e1555d1-bccd-465d-85bc-4e3dbd4d29db', 
                group: group,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canView = await service.canViewGroup(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:group')
            }

            expect.hasAssertions()
        })

        it("Should throw an error if group and post do not match", async function() {
            const service = new PermissionService(core)

            // Post to Test Open Group
            const post = entities.posts.dictionary['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de']

            // Test Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

            // User One membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                post: post,
                group: group,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canView = await service.canViewGroup(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:post')
            }

            expect.hasAssertions()
        })

        it("Should throw an error if groupId and post do not match", async function() {
            const service = new PermissionService(core)

            // Post to Test Open Group
            const post = entities.posts.dictionary['01f39e3e-e1f4-4ae2-bced-dcb9619ea3de']

            // User One membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                post: post,
                // Test Private Group
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canView = await service.canViewGroup(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:post')
            }

            expect.hasAssertions()
        })

        it("Should throw an error if Group and GroupMember do not match", async function() {
            const service = new PermissionService(core)

            // Test Hidden Group
            const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']

            // User One membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                group: group,
                groupMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canView = await service.canViewGroup(currentUser, context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:groupMember')
            }

            expect.hasAssertions()
        })
    })

    it("Should allow anyone to view an open group", async function() {
        const service = new PermissionService(core)

        // Test Open Group
        const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']

        const context = {
            group: group
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canView = await service.canViewGroup(currentUser, context)

        expect(canView).toBe(true)
    })

    it("Should allow anyone to view a private group", async function() {
        const service = new PermissionService(core)

        // Test Private Group
        const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

        const context = {
            group: group
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canView = await service.canViewGroup(currentUser, context)

        expect(canView).toBe(true)
    })

    it("Should allow members to view hidden groups", async function() {
        const service = new PermissionService(core)

        // Test Hidden Group
        const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']

        // User One membership in Test Hidden Group
        const groupMember = entities.groupMembers.dictionary['eee01f25-8669-4119-bcf6-4cd3eb3c4f26']

        const context = {
            group: group,
            groupMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canView = await service.canViewGroup(currentUser, context)

        expect(group.id).toBe(groupMember.groupId)
        expect(currentUser.id).toBe(groupMember.userId)
        expect(groupMember.role).toBe('member')
        expect(canView).toBe(true)
    })

    it("Should not allow non-members to view hidden groups", async function() {
        const service = new PermissionService(core)

        // Test Hidden Group
        const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']

        const context = {
            group: group
        }

        core.database.query.mockReturnValue(undefined)
            .mockReturnValueOnce({ rowCount: 0, rows: [ ]})

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canView = await service.canViewGroup(currentUser, context)

        expect(group.type).toBe('hidden')
        expect(canView).toBe(false)
    })

})
