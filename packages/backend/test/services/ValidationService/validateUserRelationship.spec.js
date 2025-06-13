const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validateUserRelationship()', function() {
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

        const userRelationship = { 
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        }

        const errors = await service.validateUserRelationship(null, userRelationship, null)

        expect(errors.length).toBe(2)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const userRelationship = { 
            createdDate: null,
            updatedDate: null,
        }

        const errors = await service.validateUserRelationship(null, userRelationship, null)

        expect(errors.length).toBe(2)
    })

    describe('when creating', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const userRelationship = { 
                userId: `c3638724-b30b-4c67-b117-d6c5f5735081`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`
            }

            const errors = await service.validateUserRelationship(null, userRelationship, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:missing')
        })

        it('Should return one error for each required field (userId, relationId, status) missing', async function() {
            const service = new ValidationService(core)

            const userRelationship = { }

            const errors = await service.validateUserRelationship(null, userRelationship, null)

            expect(errors.length).toBe(3)
        })

        it("Should return an error when a relationship has a status other than 'pending'", async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                status: 'confirmed'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateUserRelationship(currentUser, userRelationship, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:invalid')
        })

        it("Should pass a valid 'pending' relationship", async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                status: 'pending'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateUserRelationship(currentUser, userRelationship, null)

            expect(errors.length).toBe(0)
        })
    })

    describe('when editing', function() {
        it('Should throw an error when userRelationship.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const userRelationship = { 
                id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            }

            const existing = {
                id: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0'
            }

            try {
                const errors = await service.validateUserRelationship(currentUser, userRelationship, existing)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })

        it('Should return one error for each disallowed field included (relationId, userId) that does not match existing', async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                status: 'pending'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `9cdeea92-817a-487a-bbae-e02d83b1eeee`,
                relationId: `7cad43d6-bd5b-402a-a849-b172bd1c5711`,
                status: 'confirmed'
            }

            const errors = await service.validateUserRelationship(currentUser, userRelationship, existing)

            expect(errors.length).toBe(2)
        })

        it('Should return one error for each required field missing (status)', async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
            }

            const errors = await service.validateUserRelationship(currentUser, userRelationship, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:missing')
        })

        it("Should return an error when relationId is not currentUser.id", async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                status: 'confirmed'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                status: 'pending'
            }

            const errors = await service.validateUserRelationship(currentUser, userRelationship, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('relationId:invalid')
        })

        it("Should return an error when the existing relationship is not 'pending'", async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                relationId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                status: 'confirmed'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                relationId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                status: 'confirmed'
            }

            const errors = await service.validateUserRelationship(currentUser, userRelationship, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:invalid')
        })

        it("Should return an error when the relationship is not 'confirmed'", async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                relationId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                status: 'pending'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                relationId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                status: 'pending'
            }

            const errors = await service.validateUserRelationship(currentUser, userRelationship, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:invalid')
        })

        it("Should pass a 'confirmed' relationship with an existing relationship that is 'pending'", async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                relationId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                status: 'confirmed'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                relationId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                status: 'pending'
            }

            const errors = await service.validateUserRelationship(currentUser, userRelationship, existing)

            expect(errors.length).toBe(0)
        })
    })

    describe('validate UserRelationship fields', function() {
        it('Should return errors for invalid fields', async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                userId: 'test',
                relationId: 'test',
                status: 10
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateUserRelationship(currentUser, userRelationship, null)

            expect(errors.length).toBe(3)
        })

        it('Should pass a valid userRelationship', async function() {
            const service = new ValidationService(core)

            const userRelationship = { 
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                relationId: `62c7606b-5b1a-461a-99de-104743bd0342`,
                status: 'pending'
            }

            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateUserRelationship(currentUser, userRelationship, null)

            expect(errors.length).toBe(0)
        })
    })
})
