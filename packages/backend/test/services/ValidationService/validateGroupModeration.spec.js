const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validateGroupModeration()', function() {
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

        const groupModeration = { 
            userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
            status: 'flagged',
            reason: 'A test reason',
            postId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            postCommentId: null,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const errors = await service.validateGroupModeration(null, groupModeration, null)

        expect(errors.length).toBe(2)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const groupModeration = { 
            userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
            status: 'flagged',
            reason: 'A test reason',
            postId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            postCommentId: null,
            createdDate: null,
            updatedDate: null 
        }

        const errors = await service.validateGroupModeration(null, groupModeration, null)

        expect(errors.length).toBe(2)
    })

    describe('when creating', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const groupModeration = { 
                status: 'flagged',
                reason: 'A test reason',
                postId: 'ff6234c5-f49d-4774-b738-3251fe16fb66',
            }

            const errors = await service.validateGroupModeration(null, groupModeration, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:required')
        })

        it('Should return one error for each required field (userId, status) missing', async function() {
            const service = new ValidationService(core)

            const groupModeration = { }

            const errors = await service.validateGroupModeration(null, groupModeration, null)

            expect(errors.length).toBe(2)
        })
    })

    describe('when editing', function() {
        it('Should throw an error when groupModeration.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const groupModeration = { 
                id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            }

            const existing = {
                id: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0'
            }

            try {
                const errors = await service.validateGroupModeration(currentUser, groupModeration, existing)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })

        it('Should return one error for each disallowed field included (userId, postId, postCommentId) that does not match existing', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
                userId: '6d5e4ab8-5d71-432c-84f0-6c16543eab00',
                status: 'flagged',
                reason: 'A test reason',
                postId: 'bfbf382a-3313-4938-ab91-4dd537434803',
                postCommentId: '563d50e4-14e6-4ef1-87ad-0d4426647e0f',
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'a335d429-a7c5-429a-b6b0-5413e94e7921',
                userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
                status: 'flagged',
                reason: 'A test reason',
                postId: '7ea98d1e-dd4a-4abb-977c-1cf483356180',
                postCommentId: 'a2d49442-4068-481d-b0be-c98b3c20d788',
            }

            const errors = await service.validateGroupModeration(currentUser, groupModeration, existing)

            expect(errors.length).toBe(3)
        })
    })

    describe('validate GroupModeration fields', function() {
        it('Should return errors for invalid fields', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                userId: null,
                status: 'removed',
                reason: 25,
                postId: 'test',
                postCommentId: 'test',
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']


            const errors = await service.validateGroupModeration(currentUser, groupModeration, null)

            expect(errors.length).toBe(5)
        })

        it('Should return an error when both postId and postCommentId are missing', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
                status: 'flagged',
                reason: 'A test reason'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateGroupModeration(currentUser, groupModeration, null)

            expect(errors.length).toBe(2)
            expect(errors[0].type).toBe('postId:required')
            expect(errors[1].type).toBe('postCommentId:required')
        })

        it('Should return an error when both postId and postCommentId are present', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
                status: 'flagged',
                reason: 'A test reason',
                postId: '7ea98d1e-dd4a-4abb-977c-1cf483356180',
                postCommentId: 'a2d49442-4068-481d-b0be-c98b3c20d788'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateGroupModeration(currentUser, groupModeration, null)

            expect(errors.length).toBe(2)
            expect(errors[0].type).toBe('postId:conflict')
            expect(errors[1].type).toBe('postCommentId:conflict')
        })

        it('Should return an error when userId is not found in the database', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                id: '2a52fb39-a8bb-4f4a-badf-ec467d76cd8d',
                userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
                status: 'flagged',
                reason: 'A test reason',
                postId: '7ea98d1e-dd4a-4abb-977c-1cf483356180',
                postCommentId: null,
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '7ea98d1e-dd4a-4abb-977c-1cf483356180' } ]})
                 

            const errors = await service.validateGroupModeration(currentUser, groupModeration, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:not-found')
        })

        it('Should return an error when postId is not found in the database', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                id: '2a52fb39-a8bb-4f4a-badf-ec467d76cd8d',
                userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
                status: 'flagged',
                reason: 'A test reason',
                postId: '7ea98d1e-dd4a-4abb-977c-1cf483356180',
                postCommentId: null,
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4c73dbae-3d03-43cd-b03d-5be4953b832b' } ]})
                .mockReturnValueOnce({ rowCount: 0, rows: [ ]})
                 

            const errors = await service.validateGroupModeration(currentUser, groupModeration, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('postId:not-found')
        })

        it('Should return an error when postCommentId is not found in the database', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                id: '2a52fb39-a8bb-4f4a-badf-ec467d76cd8d',
                userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
                status: 'flagged',
                reason: 'A test reason',
                postId: null,
                postCommentId: '7ea98d1e-dd4a-4abb-977c-1cf483356180',
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4c73dbae-3d03-43cd-b03d-5be4953b832b' } ]})
                .mockReturnValueOnce({ rowCount: 0, rows: [ ]})
                 

            const errors = await service.validateGroupModeration(currentUser, groupModeration, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('postCommentId:not-found')
        })

        it('Should pass a valid groupModeration', async function() {
            const service = new ValidationService(core)

            const groupModeration = { 
                id: '2a52fb39-a8bb-4f4a-badf-ec467d76cd8d',
                userId: '4c73dbae-3d03-43cd-b03d-5be4953b832b',
                status: 'flagged',
                reason: 'A test reason',
                postId: null,
                postId: '7ea98d1e-dd4a-4abb-977c-1cf483356180',
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4c73dbae-3d03-43cd-b03d-5be4953b832b' }]})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '7ea98d1e-dd4a-4abb-977c-1cf483356180' }]})

            const errors = await service.validateGroupModeration(currentUser, groupModeration, null)

            expect(errors.length).toBe(0)
        })
    })
})
