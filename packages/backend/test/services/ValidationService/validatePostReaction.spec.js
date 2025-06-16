const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validatePostReaction()', function() {
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

    it('Should return one error for each disallowed field included (createdDate, updatedDate)', async function() {
        const service = new ValidationService(core)

        const postReaction = { 
            postId: '43aa8308-787b-4da7-b81a-984f07f6bc62',
            userId: 'cf2b089e-f315-475d-a07d-ab8859437a0e',
            reaction: 'like',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        }

        const errors = await service.validatePostReaction(null, postReaction, null)

        expect(errors.length).toBe(2)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const postReaction = { 
            postId: '43aa8308-787b-4da7-b81a-984f07f6bc62',
            userId: 'cf2b089e-f315-475d-a07d-ab8859437a0e',
            reaction: 'like',
            createdDate: null,
            updatedDate: null,
        }

        const errors = await service.validatePostReaction(null, postReaction, null)

        expect(errors.length).toBe(2)
    })

    describe('when creating', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const postReaction = { 
                userId: `c3638724-b30b-4c67-b117-d6c5f5735081`,
                postId: `62c7606b-5b1a-461a-99de-104743bd0342`
            }

            const errors = await service.validatePostReaction(null, postReaction, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('reaction:required')
        })

        it('Should return one error for each required field (userId, postId, reaction) missing', async function() {
            const service = new ValidationService(core)

            const postReaction = { }

            const errors = await service.validatePostReaction(null, postReaction, null)

            expect(errors.length).toBe(3)
        })
    })

    describe('when editing', function() {
        it('Should throw an error when postReaction.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const postReaction = { 
                id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            }

            const existing = {
                id: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0'
            }

            try {
                const errors = await service.validatePostReaction(currentUser, postReaction, existing)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })

        it('Should return one error for each disallowed field included (postId, userId) that does not match existing', async function() {
            const service = new ValidationService(core)

            const postReaction = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                postId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                reaction: 'like'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `9cdeea92-817a-487a-bbae-e02d83b1eeee`,
                postId: `7cad43d6-bd5b-402a-a849-b172bd1c5711`,
                reaction: 'like'
            }

            const errors = await service.validatePostReaction(currentUser, postReaction, existing)

            expect(errors.length).toBe(2)
        })

        it('Should return one error for each required field missing (reaction)', async function() {
            const service = new ValidationService(core)

            const postReaction = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                postId: `62c7606b-5b1a-461a-99de-104743bd0342`,
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                postId: `62c7606b-5b1a-461a-99de-104743bd0342`,
            }

            const errors = await service.validatePostReaction(currentUser, postReaction, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('reaction:required')
        })
    })

    describe('validate PostReaction fields', function() {
        it('Should return errors for invalid fields', async function() {
            const service = new ValidationService(core)

            const postReaction = { 
                userId: 'test',
                postId: 'test',
                reaction: 10
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validatePostReaction(currentUser, postReaction, null)

            expect(errors.length).toBe(3)
        })

        it('Should pass a valid postReaction', async function() {
            const service = new ValidationService(core)

            const postReaction = { 
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                postId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                reaction: 'like'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validatePostReaction(currentUser, postReaction, null)

            expect(errors.length).toBe(0)
        })
    })
})
