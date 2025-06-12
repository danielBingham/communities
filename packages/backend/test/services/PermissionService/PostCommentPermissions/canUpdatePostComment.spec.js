const Logger = require('../../../../logger')
const FeatureFlags = require('../../../../features')

const ServiceError = require('../../../../errors/ServiceError')
const PermissionService = require('../../../../services/PermissionService')

const entities = require('../../../fixtures/entities')
const database = require('../../../fixtures/database')

describe("PostCommentPermissions.canUpdatePostComment()", function() {

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

    it("Should not allow users to update other users PostComments", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const postComment = {
            id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
            userId: '3f69c43b-9ffc-4685-884a-99ac30629e93',
            postId: 'fabed713-6b9c-4a48-83bc-3c7fd230074d',
            content: 'Comment!',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const canUpdatePostComment = await service.can(currentUser, 'update', 'PostComment', { postComment: postComment })

        expect(canUpdatePostComment).toBe(false)
        expect(postComment.userId).not.toBe(currentUser.id)
    })

    it("Should allow users to update their own PostComments", async function() {
        const service = new PermissionService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const postComment = {
            id: '78a6c6ce-4b4c-4c6b-b934-56886fd340a9',
            userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
            postId: 'fabed713-6b9c-4a48-83bc-3c7fd230074d',
            content: 'Comment!',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const canUpdatePostComment = await service.can(currentUser, 'update', 'PostComment', { postComment: postComment })

        expect(canUpdatePostComment).toBe(true)
        expect(postComment.userId).toBe(currentUser.id)
    })
})
