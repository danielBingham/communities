const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')
const UserRelationshipPermissions = require('../../../../services/permission/UserRelationshipPermissions')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe("UserRelationshipPermissions.canViewUserRelationship()", function() {

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

    it("Should return false when a user attempts to view a relationship they aren't a part of", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const userRelationship = { 
            userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
            relationId: '0a67da87-b9b5-4c38-b0d1-3551347ffce4',
            status: 'pending'
        }

        const canViewUserRelationship = await service.can(currentUser, 'view', 'UserRelationship', 
            { userId: userRelationship.userId, relationId: userRelationship.relationId })

        expect(userRelationship.userId).not.toBe(currentUser.id)
        expect(userRelationship.relationId).not.toBe(currentUser.id)
        expect(canViewUserRelationship).toBe(false)
    })

    it("Should return true when a user attempts to view a relationship request", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const userRelationship = { 
            userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            relationId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            status: 'pending'
        }

        const canViewUserRelationship = await service.can(currentUser, 'view', 'UserRelationship', 
            { userId: userRelationship.userId, relationId: userRelationship.relationId })

        expect(userRelationship.userId).not.toBe(currentUser.id)
        expect(userRelationship.relationId).toBe(currentUser.id)
        expect(canViewUserRelationship).toBe(true)
    })

    it("Should return true when a user attempts to view a relationship they created", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const userRelationship = { 
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            relationId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            status: 'pending'
        }

        const canViewUserRelationship = await service.can(currentUser, 'view', 'UserRelationship', 
            { userId: userRelationship.userId, relationId: userRelationship.relationId })

        expect(userRelationship.userId).toBe(currentUser.id)
        expect(canViewUserRelationship).toBe(true)
    })
})
