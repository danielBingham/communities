const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe("PostSubscriptionPermissions.canUpdatePostSubscription()", function() {

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

    it("Should not allow user to view another user's PostSubscription", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const postSubscription = {
            id: 'f2554cba-b71e-4f96-abd4-3ca149934b0f',
            postId: '958ccb84-5d27-4fc3-9e44-48b4fbde8dc9',
            userId: '1423d8b2-2afc-494b-a026-02eb177b4885',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const canUpdatePostSubscription = await service.can(currentUser, 'update', 'PostSubscription', { postSubscription: postSubscription })

        expect(canUpdatePostSubscription).toBe(false)
    })

    it("Should allow a user to view their own PostSubscription", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const postSubscription = {
            id: 'f2554cba-b71e-4f96-abd4-3ca149934b0f',
            postId: '958ccb84-5d27-4fc3-9e44-48b4fbde8dc9',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const canUpdatePostSubscription = await service.can(currentUser, 'update', 'PostSubscription', { postSubscription: postSubscription })

        expect(canUpdatePostSubscription).toBe(true)
    })
})
