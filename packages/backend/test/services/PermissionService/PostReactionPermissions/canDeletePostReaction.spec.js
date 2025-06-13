const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe("PostReactionPermissions.canDeletePostReaction()", function() {

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

    it("Should not allow users to delete other users PostReactions", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

        const postReaction = {
            id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
            userId: '3f69c43b-9ffc-4685-884a-99ac30629e93',
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const canDeletePostReaction = await service.can(currentUser, 'delete', 'PostReaction', { post: post, postReaction: postReaction })

        expect(canDeletePostReaction).toBe(false)
        expect(postReaction.userId).not.toBe(currentUser.id)
    })

    it("Should allow users to delete their own PostReactions", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const post = entities.posts.dictionary['703955d2-77df-4635-8ab8-b9108fef217f']

        const postReaction = {
            id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const canDeletePostReaction = await service.can(currentUser, 'delete', 'PostReaction', { post: post, postReaction: postReaction })

        expect(canDeletePostReaction).toBe(true)
        expect(postReaction.userId).toBe(currentUser.id)
    })
})
