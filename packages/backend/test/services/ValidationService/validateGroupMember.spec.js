const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validateGroupMember()', function() {
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

    it('Should return one error for each disallowed field included (createdDate, updatedDate, entranceAnswers)', async function() {
        const service = new ValidationService(core)

        const groupMember = { 
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
            entranceAnswers: {}
        }

        const errors = await service.validateGroupMember(null, groupMember, null)

        expect(errors.length).toBe(3)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const groupMember = { 
            createdDate: null,
            updatedDate: null,
            entranceAnswers: null
        }

        const errors = await service.validateGroupMember(null, groupMember, null)

        expect(errors.length).toBe(3)
    })

    describe('when creating', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const groupMember = { 
                groupId: `0abc68f8-cbdd-4909-88d9-6decbd6ffcc6`,
                status: 'member'
            }

            const errors = await service.validateGroupMember(null, groupMember, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:missing')
        })

        it('Should return one error for each required field (type, title, slug) missing', async function() {
            const service = new ValidationService(core)

            const groupMember = { }

            const errors = await service.validateGroupMember(null, groupMember, null)

            expect(errors.length).toBe(3)
        })
    })

    describe('when editing', function() {
        it('Should throw an error when groupMember.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const groupMember = { 
                id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
            }

            const existing = {
                id: '6f905f93-7ff2-4df0-82d2-4ff7f78fb0b0'
            }

            try {
                const errors = await service.validateGroupMember(currentUser, groupMember, existing)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })

        it('Should return one error for each disallowed field included (userId, groupId) that does not match existing', async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `68a61c40-1a48-41b9-a60a-d99f582b1fd2`,
                groupId: `6d9034df-0c14-410e-973a-14889df1ab4a`
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `51290212-4b4f-455c-baad-f63cbe695a95`,
                groupId: `409edbe0-77fe-49a3-b157-c77f83e0b2d1`
            }

            const errors = await service.validateGroupMember(currentUser, groupMember, existing)

            expect(errors.length).toBe(2)
        })

        it('Should not return errors for disallowed fields that match existing', async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `68a61c40-1a48-41b9-a60a-d99f582b1fd2`,
                groupId: `6d9034df-0c14-410e-973a-14889df1ab4a`
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const existing = {
                id: 'd3d5d52e-8c9b-427e-9823-9b9c5af77a6a',
                userId: `68a61c40-1a48-41b9-a60a-d99f582b1fd2`,
                groupId: `6d9034df-0c14-410e-973a-14889df1ab4a`
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '68a61c40-1a48-41b9-a60a-d99f582b1fd2' }]})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '6d9034df-0c14-410e-973a-14889df1ab4a' }]})

            const errors = await service.validateGroupMember(currentUser, groupMember, existing)

            expect(errors.length).toBe(0)
        })
    })

    describe('validate GroupMember fields', function() {
        it('Should return errors for invalid fields', async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                groupId: 'invalid',
                userId: 'invalid',
                status: 'test',
                role: 'test'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const errors = await service.validateGroupMember(currentUser, groupMember, null)

            expect(errors.length).toBe(4)
        })

        it('Should return an error when userId is not found in the database', async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                userId: `68a61c40-1a48-41b9-a60a-d99f582b1fd2`,
                groupId: `6d9034df-0c14-410e-973a-14889df1ab4a`,
                status: 'member',
                role: 'member'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '6d9034df-0c14-410e-973a-14889df1ab4a' }]})

            const errors = await service.validateGroupMember(currentUser, groupMember, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:not-found')
        })

        it('Should return an error when groupId is not found in the database', async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                userId: `68a61c40-1a48-41b9-a60a-d99f582b1fd2`,
                groupId: `6d9034df-0c14-410e-973a-14889df1ab4a`,
                status: 'member',
                role: 'member'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '68a61c40-1a48-41b9-a60a-d99f582b1fd2' }]})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateGroupMember(currentUser, groupMember, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('groupId:not-found')
        })

        it('Should pass a valid groupMember', async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                userId: `68a61c40-1a48-41b9-a60a-d99f582b1fd2`,
                groupId: `6d9034df-0c14-410e-973a-14889df1ab4a`,
                status: 'member',
                role: 'member'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '68a61c40-1a48-41b9-a60a-d99f582b1fd2' }]})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '6d9034df-0c14-410e-973a-14889df1ab4a' }]})

            const errors = await service.validateGroupMember(currentUser, groupMember, null)

            expect(errors.length).toBe(0)
        })
    })
})
