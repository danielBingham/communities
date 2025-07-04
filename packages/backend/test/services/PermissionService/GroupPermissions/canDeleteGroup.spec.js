const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe('PermissionService.canDeleteGroup()', function() {

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

    xdescribe('with context', function() {
        it("Should not look up Group or GroupMember when they are in context", async function() {
            const service = new PermissionService(core)

            // Test Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

            // User One admin membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['a1c5361e-3e46-435b-bab4-0a74ddbd79e2']

            const context = {
                group: group,
                userMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.can(currentUser, 'delete', 'Group', context)

            expect(group.id).toBe(groupMember.groupId)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('admin')
            expect(canDelete).toBe(true)
        })

        it("Should look up Group when not in context", async function() {
            const service = new PermissionService(core)

            // User One admin membership in Test Private Group
            const groupMember = entities.groupMembers.dictionary['a1c5361e-3e46-435b-bab4-0a74ddbd79e2']

            const context = {
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                userMember: groupMember
            }

            const groupRows = database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.can(currentUser, 'delete', 'Group', context)

            expect(context.groupId).toBe(groupMember.groupId)
            expect(currentUser.id).toBe(groupMember.userId)
            expect(groupMember.role).toBe('admin')
            expect(canDelete).toBe(true)
        })

        it("Should look up GroupMember when not in context", async function() {
            const service = new PermissionService(core)

            // Test Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

            const context = {
                group: group
            }

            const groupMemberRows = database.groupMembers['a1c5361e-3e46-435b-bab4-0a74ddbd79e2'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: groupMemberRows.length, rows: groupMemberRows })

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const canDelete = await service.can(currentUser, 'delete', 'Group', context)

            expect(groupMemberRows[0].GroupMember_groupId).toBe(group.id)
            expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
            expect(groupMemberRows[0].GroupMember_role).toBe('admin')
            expect(canDelete).toBe(true)
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
                userMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canDelete = await service.can(currentUser, 'delete', 'Group', context)
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
                userMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canDelete = await service.can(currentUser, 'delete', 'Group', context)
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
                userMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canDelete = await service.can(currentUser, 'delete', 'Group', context)
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
                userMember: groupMember
            }

            // User One 
            const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            try {
                const canDelete = await service.can(currentUser, 'delete', 'Group', context)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-context:groupMember')
            }

            expect.hasAssertions()
        })
    })

    it("Should allow an admin to delete an open group", async function() {
        const service = new PermissionService(core)

        // Test Open Group
        const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']

        // User One admin membership in Test Open Group
        const groupMember = entities.groupMembers.dictionary['684f7a9f-d415-48a3-be9b-2cd953da47f5']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('open')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('admin')
        expect(canDelete).toBe(true)
    })

    it("Should not allow a moderator to delete an open group", async function() {
        const service = new PermissionService(core)

        // Test Open Group
        const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']

        // User One moderator membership in Test Open Group
        const groupMember = entities.groupMembers.dictionary['7a42357c-9511-4c36-81db-97a492c7934c']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('open')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('moderator')
        expect(canDelete).toBe(false)
    })

    it("Should not allow a member to delete an open group", async function() {
        const service = new PermissionService(core)

        // Test Open Group
        const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']

        // User One membership in Test Open Group
        const groupMember = entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('open')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('member')
        expect(canDelete).toBe(false)
    })

    it("Should allow an admin to delete a private group", async function() {
        const service = new PermissionService(core)

        // Test Private Group
        const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

        // User One admin membership in Test Private Group
        const groupMember = entities.groupMembers.dictionary['a1c5361e-3e46-435b-bab4-0a74ddbd79e2']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('private')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('admin')
        expect(canDelete).toBe(true)
    })

    it("Should not allow a moderator to delete a private group", async function() {
        const service = new PermissionService(core)

        // Test Private Group
        const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

        // User One moderator membership in Test Private Group
        const groupMember = entities.groupMembers.dictionary['30d5291a-8df7-4c82-9508-ffa78a00217b']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('private')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('moderator')
        expect(canDelete).toBe(false)
    })

    it("Should not allow a member to delete a private group", async function() {
        const service = new PermissionService(core)

        // Test Private Group
        const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

        // User One membership in Test Private Group
        const groupMember = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('private')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('member')
        expect(canDelete).toBe(false)
    })

    it("Should allow an admin to delete a hidden group", async function() {
        const service = new PermissionService(core)

        // Test Hidden Group
        const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']

        // User One admin membership in Test Hidden Group
        const groupMember = entities.groupMembers.dictionary['e0eebdfd-b9b7-4f78-8035-cffe34f195f8']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('hidden')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('admin')
        expect(canDelete).toBe(true)
    })

    it("Should not allow a moderator to delete a hidden group", async function() {
        const service = new PermissionService(core)

        // Test Hidden Group
        const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']

        // User One moderator membership in Test Hidden Group
        const groupMember = entities.groupMembers.dictionary['664390e9-88d2-4114-8018-0b428dd47907']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('hidden')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('moderator')
        expect(canDelete).toBe(false)
    })

    it("Should not allow a member to delete a hidden group", async function() {
        const service = new PermissionService(core)

        // Test Hidden Group
        const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']

        // User One membership in Test Hidden Group
        const groupMember = entities.groupMembers.dictionary['eee01f25-8669-4119-bcf6-4cd3eb3c4f26']

        const context = {
            group: group,
            userMember: groupMember
        }

        // User One 
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canDelete = await service.can(currentUser, 'delete', 'Group', context)

        expect(group.type).toBe('hidden')
        expect(groupMember.userId).toBe(currentUser.id)
        expect(groupMember.groupId).toBe(group.id)
        expect(groupMember.role).toBe('member')
        expect(canDelete).toBe(false)
    })

})
