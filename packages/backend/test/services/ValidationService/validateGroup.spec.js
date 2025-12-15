const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validateGroup()', function() {
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

        const group = { 
            type: 'open',
            postPermissions: 'members',
            title: 'A test group',
            slug: 'a-test-group',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
            entranceQuestions: {}
        }

        const errors = await service.validateGroup(null, group, null)

        expect(errors.length).toBe(3)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const group = { 
            type: 'open',
            postPermissions: 'members',
            title: 'A test group',
            slug: 'a-test-group',
            createdDate: null,
            updatedDate: null,
            entranceQuestions: null
        }

        const errors = await service.validateGroup(null, group, null)

        expect(errors.length).toBe(3)
    })

    describe('when creating', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const group = { 
                title: 'A Group Title',
                slug: 'a-group-title',
                postPermissions: 'members'
            }

            const errors = await service.validateGroup(null, group, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('type:required')
        })

        it('Should return one error for each required field (type, postPermissions, title, slug) missing', async function() {
            const service = new ValidationService(core)

            const group = { }

            const errors = await service.validateGroup(null, group, null)

            expect(errors.length).toBe(4)
        })
    })

    describe('when editing', function() {
        it('Should throw an error when group.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const group = { 
                id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            }

            const existing = {
                id: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0'
            }

            try {
                const errors = await service.validateGroup(currentUser, group, existing)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })

        it('Should return one error for each disallowed field included (type, slug) that does not match existing', async function() {
            const service = new ValidationService(core)

            const group = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                type: 'open',
                slug: 'a-test-group'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                type: 'private',
                slug: 'a-private-group'
            }

            const errors = await service.validateGroup(currentUser, group, existing)

            expect(errors.length).toBe(2)
        })
    })

    describe('validate Group fields', function() {
        it('Should return errors for invalid fields', async function() {
            const service = new ValidationService(core)

            const group = { 
                type: 'public',
                postPermissions: 'open',
                title: 10,
                slug: 10,
                about: 10,
                fileId: 'invalid'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateGroup(currentUser, group, null)

            expect(errors.length).toBe(6)
        })

        it('Should return an error when fileId is not found in the database', async function() {
            const service = new ValidationService(core)

            const group = { 
                fileId: 'c8d958ac-4bed-44ad-a934-ca28e3525461',
                type: 'open',
                postPermissions: 'members',
                title: 'A Test Group',
                slug: 'a-test-group'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateGroup(currentUser, group, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('fileId:not-found')
        })

        it('Should pass a valid group', async function() {
            const service = new ValidationService(core)

            const group = { 
                type: 'open',
                postPermissions: 'members',
                title: 'A Test Group',
                slug: 'a-test-group',
                about: 'This is a test group.',
                fileId: 'c8d958ac-4bed-44ad-a934-ca28e3525461'

            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'c8d958ac-4bed-44ad-a934-ca28e3525461' }]})

            const errors = await service.validateGroup(currentUser, group, null)

            expect(errors.length).toBe(0)
        })
    })
})
