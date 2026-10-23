const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')

describe("CommentReactionPermissions.canViewCommentReaction()", function() {

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

    it("Should allow users to view CommentReactions (comment visibility is checked by the caller)", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const postComment = {
            id: '9d6c2a41-5b1e-4f5a-a3c2-7e8f9a0b1c2d',
            postId: '703955d2-77df-4635-8ab8-b9108fef217f',
            userId: '3f69c43b-9ffc-4685-884a-99ac30629e93',
            content: 'Comment!'
        }

        const can = await service.can(currentUser, 'view', 'CommentReaction', { postComment: postComment })

        expect(can).toBe(true)
    })
})
