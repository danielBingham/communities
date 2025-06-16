const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validateBlocklist()', function() {
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

        const blocklist = { 
            userId: '277f2a56-d7a4-4f9c-9a40-db3a498f59f1',
            domain: 'example.com',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const errors = await service.validateBlocklist(null, blocklist, null)

        expect(errors.length).toBe(2)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const blocklist = { 
            userId: '277f2a56-d7a4-4f9c-9a40-db3a498f59f1',
            domain: 'example.com',
            createdDate: null,
            updatedDate: null
        }

        const errors = await service.validateBlocklist(null, blocklist, null)

        expect(errors.length).toBe(2)
    })

    describe('when creating', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const blocklist = { 
                domain: 'mailinator.com'
            }

            const errors = await service.validateBlocklist(null, blocklist, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:required')
        })

        it('Should return one error for each required field (userId, domain) missing', async function() {
            const service = new ValidationService(core)

            const blocklist = { }

            const errors = await service.validateBlocklist(null, blocklist, null)

            expect(errors.length).toBe(2)
        })
    })

    describe('when editing', function() {
        it('Should throw an error when blocklist.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const blocklist = { 
                id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            }

            const existing = {
                id: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0'
            }

            try {
                const errors = await service.validateBlocklist(currentUser, blocklist, existing)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })

        it('Should return one error for each disallowed field included (userId, domain) that does not match existing', async function() {
            const service = new ValidationService(core)

            const blocklist = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0',
                domain: 'mailinator.com'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: '4d908eb1-de6c-479c-b0b2-ec8b8fb8aae6',
                domain: 'example.com'
            }

            const errors = await service.validateBlocklist(currentUser, blocklist, existing)

            expect(errors.length).toBe(2)
        })
    })

    describe('validate Blocklist fields', function() {
        it('Should return errors for invalid fields', async function() {
            const service = new ValidationService(core)

            const blocklist = { 
                userId: 'test-id',
                domain: 10,
                notes: 10
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']


            const errors = await service.validateBlocklist(currentUser, blocklist, null)

            expect(errors.length).toBe(3)
        })

        it('Should return an error when userId is not found in the database', async function() {
            const service = new ValidationService(core)

            const blocklist = { 
                userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                domain: 'mailinator.com',
                notes: 'Do not allow testing emails.' 
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateBlocklist(currentUser, blocklist, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:not-found')
        })

        it('Should return an error when userId does not match currentUser.id', async function() {
            const service = new ValidationService(core)

            const blocklist = { 
                userId: 'c3684b1e-ca4d-4df1-bd6b-0f5ff0174f24',
                domain: 'mailinator.com',
                notes: 'Do not allow testing emails.' 
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'c3684b1e-ca4d-4df1-bd6b-0f5ff0174f24' }]})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateBlocklist(currentUser, blocklist, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:not-authorized')
        })

        it('Should return errors when blocklist for domain already exists', async function() {
            const service = new ValidationService(core)

            const blocklist = { 
                userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                domain: 'mailinator.com',
                notes: 'Do not allow testing emails.' 
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '70612244-80c3-49d9-82b3-3964f0568d8d' }]})

            const errors = await service.validateBlocklist(currentUser, blocklist, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('domain:conflict')
        })

        it('Should pass a valid blocklist', async function() {
            const service = new ValidationService(core)

            const blocklist = { 
                userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                domain: 'mailinator.com',
                notes: 'Do not allow testing emails.' 
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateBlocklist(currentUser, blocklist, null)

            expect(errors.length).toBe(0)
        })
    })
})
