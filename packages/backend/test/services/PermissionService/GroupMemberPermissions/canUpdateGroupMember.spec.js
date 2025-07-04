const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')
const GroupMemberPermissions = require('../../../../services/permission/GroupMemberPermissions')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe("GroupMemberPermissions.canUpdateGroupMember()", function() {

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

    describe("for 'open' groups", function() {
        it("Should allow members to update themselves", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']
            const userMember = entities.groupMembers.dictionary['a9e18581-0826-491a-835a-751bcfc228a8']

            const groupMember = {
                userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(userMember.role).toBe('member')
        })

        it("Should allow admins to update members", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']
            const userMember = entities.groupMembers.dictionary['fef5f5a1-b500-4694-a5ca-c7ebea359295']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('admin')
        })

        it("Should allow moderators to update members", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']
            const userMember = entities.groupMembers.dictionary['bb88818d-6426-4e5a-b79a-688a700fef11']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('moderator')
        })

        it("Should not allow non-moderators to update members for other users", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']
            const userMember = entities.groupMembers.dictionary['a9e18581-0826-491a-835a-751bcfc228a8']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(false)
            expect(groupMember.groupId).toBe(group.id)
            expect(currentUser.id).toBe(userMember.userId)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('member')
        })
    })

    describe("for 'private' groups", function() {
        it("Should allow members to update themselves", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']
            const userMember = entities.groupMembers.dictionary['bb64caa2-a6a6-43be-a11d-349b6e68f5a8']

            const groupMember = {
                userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(userMember.role).toBe('member')
        })


        it("Should allow admins to update members", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']
            const userMember = entities.groupMembers.dictionary['1a7be2fb-104d-4d9a-869e-5b91f829ebdc']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('admin')
        })

        it("Should allow moderators to update members for other users", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']
            const userMember = entities.groupMembers.dictionary['23d1cffa-856b-4f05-be4d-23913d59aa1d']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.groupId).toBe(group.id)
            expect(currentUser.id).toBe(userMember.userId)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('moderator')
        })

        it("Should not allow non-admins to update members for other users", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']
            const userMember = entities.groupMembers.dictionary['bb64caa2-a6a6-43be-a11d-349b6e68f5a8']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(false)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.groupId).toBe(group.id)
            expect(currentUser.id).toBe(userMember.userId)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('member')
        })
    })

    describe("for 'hidden' groups", function() {
        it("Should allow members to update themselves", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']
            const userMember = entities.groupMembers.dictionary['d0fa5e53-4306-4b0d-91cb-22df17a46104']

            const groupMember = {
                userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).toBe(currentUser.id)
            expect(userMember.role).toBe('member')
        })

        it("Should allow admins to update members", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']
            const userMember = entities.groupMembers.dictionary['57558350-2c7f-4bf3-9d60-f4071e1782b0']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('admin')
        })

        it("Should allow moderators to update members", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']
            const userMember = entities.groupMembers.dictionary['1ac80a4a-1a5f-4f8c-a4a1-47ef52c54460']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(true)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.groupId).toBe(group.id)
            expect(userMember.userId).toBe(currentUser.id)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('moderator')
        })

        it("Should not allow non-moderators to update members for other users", async function() {
            const permissionService = new PermissionService(core)
            const groupMemberPermissions = new GroupMemberPermissions(core, permissionService)

            const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']

            const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']
            const userMember = entities.groupMembers.dictionary['d0fa5e53-4306-4b0d-91cb-22df17a46104']

            const groupMember = {
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                status: 'member',
                role: 'member'
            }

            const canUpdateGroupMember = await groupMemberPermissions.canUpdateGroupMember(currentUser, 
                { group: group, groupMember: groupMember, userMember: userMember })

            expect(canUpdateGroupMember).toBe(false)
            expect(groupMember.groupId).toBe(group.id)
            expect(userMember.groupId).toBe(group.id)
            expect(currentUser.id).toBe(userMember.userId)
            expect(groupMember.userId).not.toBe(currentUser.id)
            expect(userMember.role).toBe('member')
        })
    })
})
