const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe('PermissionService.canSudoSite()', function() {

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

        core.features.features = { }
    })

    it("Should not allow a user with the 'member' role to admin", async function() {
        const service = new PermissionService(core)

        const context = { }

        // Member User
        const currentUser = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const canSudo = await service.canSudoSite(currentUser, context)

        expect(currentUser.siteRole).toBe('user')
        expect(canSudo).toBe(false)
    })

    it("Should not allow a user with the 'moderator' role to admin", async function() {
        const service = new PermissionService(core)

        const context = { }

        // Moderator User
        const currentUser = entities['users'].dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

        const canSudo = await service.canSudoSite(currentUser, context)

        expect(currentUser.siteRole).toBe('moderator')
        expect(canSudo).toBe(false)

    })

    it("Should allow a user with 'admin' role to admin", async function() {
        const service = new PermissionService(core)

        const context = { }

        // Admin User
        const currentUser = entities['users'].dictionary['4b660bba-3e58-493f-86e1-ec3c651acc40']

        const canSudo = await service.canSudoSite(currentUser, context)

        expect(currentUser.siteRole).toBe('admin')
        expect(canSudo).toBe(false)
    })

    it("Should allow a user with 'superadmin' role to admin", async function() {
        const service = new PermissionService(core)

        const context = { }

        // SuperAdmin User
        const currentUser = entities['users'].dictionary['469931f6-26f2-4e1c-b4a0-849aed14e977']

        const canSudo = await service.canSudoSite(currentUser, context)

        expect(currentUser.siteRole).toBe('superadmin')
        expect(canSudo).toBe(true)
    })

})
