const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')
const GroupMemberPermissions = require('../../../../services/permission/GroupMemberPermissions')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe("GroupMemberPermissions.canViewGroupMember()", function() {

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


    describe("For an Open Group", function() {
        it("Should allow non-members to view GroupMembers", async function() {
            const service = new PermissionService(core)
            const permissions = new GroupMemberPermissions(core, service)

            // User One
            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            // Open Group
            const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']

            const context = {
                group: group,
                userMember: null 
            }

            const canViewGroupMember = await permissions.canViewGroupMember(currentUser, context)

            expect(canViewGroupMember).toBe(true)
        })

        it("Should allow members to view GroupMembers", async function() {
            const service = new PermissionService(core)
            const permissions = new GroupMemberPermissions(core, service)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            // Open Group
            const group = entities.groups.dictionary['aeb26ec5-3644-4b7a-805e-375551ec65b6']
            // User One 'member' membership in Open Group
            const membership = entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9']

            const context = {
                group: group,
                userMember: membership 
            }

            const canViewGroupMember = await permissions.canViewGroupMember(currentUser, context)

            expect(canViewGroupMember).toBe(true)
        })
    })

    describe("For a Priavte Group", function() {
        it("Should not allow non-members to view GroupMembers", async function() {
            const service = new PermissionService(core)
            const permissions = new GroupMemberPermissions(core, service)

            // User One
            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            // Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']

            const context = {
                group: group,
                userMember: null 
            }

            const canViewGroupMember = await permissions.canViewGroupMember(currentUser, context)

            expect(canViewGroupMember).toBe(false)
        })

        it("Should allow members to view GroupMembers", async function() {
            const service = new PermissionService(core)
            const permissions = new GroupMemberPermissions(core, service)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            // Private Group
            const group = entities.groups.dictionary['8661a1ef-6259-4d5a-a59f-4d75929a765f']
            // User One 'member' membership in Private Group
            const membership = entities.groupMembers.dictionary['0e1555d1-bccd-465d-85bc-4e3dbd4d29db']

            const context = {
                group: group,
                userMember: membership 
            }

            const canViewGroupMember = await permissions.canViewGroupMember(currentUser, context)

            expect(canViewGroupMember).toBe(true)
        })
    })

    describe("For a Hidden Group", function() {
        it("Should not allow non-members to view GroupMembers", async function() {
            const service = new PermissionService(core)
            const permissions = new GroupMemberPermissions(core, service)

            // User One
            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            // Hidden Group
            const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']

            const context = {
                group: group,
                userMember: null 
            }

            const canViewGroupMember = await permissions.canViewGroupMember(currentUser, context)

            expect(canViewGroupMember).toBe(false)
        })

        it("Should allow members to view GroupMembers", async function() {
            const service = new PermissionService(core)
            const permissions = new GroupMemberPermissions(core, service)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            // Hidden Group
            const group = entities.groups.dictionary['4e66c241-ef21-4143-b7b4-c4fe81a34acd']
            // User One 'member' membership in Private Group
            const membership = entities.groupMembers.dictionary['eee01f25-8669-4119-bcf6-4cd3eb3c4f26']

            const context = {
                group: group,
                userMember: membership 
            }

            const canViewGroupMember = await permissions.canViewGroupMember(currentUser, context)

            expect(canViewGroupMember).toBe(true)
        })
    })

})
