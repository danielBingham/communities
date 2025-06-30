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

        describe("for an 'open' group", function() {
            it("Should return an error if a non-member attempts to create a member with a role other than 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'member',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:invalid')
            })

            it("Should return an error if a non-member attempts to create a member with a status other than 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:invalid')
            })

            it("Should return an error if a non-member attempts to create a member for a user other than themselves", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `2a7ae011-689c-4aa2-8f13-a53026d40964`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '2a7ae011-689c-4aa2-8f13-a53026d40964' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:invalid')
            })

            it("Should allow a non-member to add themselves", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(0)
            })

            it("Should return an error if a moderator attemts to create a member with a role other than 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'pending-invited',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['7a42357c-9511-4c36-81db-97a492c7934c'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)
                    .mockReturnValueOnce({ rowCount: 0, rows: database.groupMembers['7a42357c-9511-4c36-81db-97a492c7934c'].rows }) // permissionService.can -> getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe(`role:invalid`)
            })

            it("Should return an error if a moderator attempts to create a member with a status other than 'pending-invited'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['7a42357c-9511-4c36-81db-97a492c7934c'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)
                    .mockReturnValueOnce({ rowCount: 0, rows: database.groupMembers['7a42357c-9511-4c36-81db-97a492c7934c'].rows }) // permissionService.can -> getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe(`status:invalid`)
            })

            it("Should allow a moderator member to invite non-members", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['7a42357c-9511-4c36-81db-97a492c7934c'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)
                    //.mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['7a42357c-9511-4c36-81db-97a492c7934c'].rows }) // permissionService.can -> getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(0)
            })

            it("Should thow an error if a non-moderator attempts to invite a non-member", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)
                    //.mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows }) // permissionService.can -> getGroupMemberByGroupAndUser(group, currentUser)

                try {
                    const errors = await service.validateGroupMember(currentUser, groupMember, null)
                } catch (error) {
                    expect(error).toBeInstanceOf(ServiceError)
                    expect(error.type).toBe('invalid-permissions')
                }

                expect.hasAssertions()
            })
        })

        describe("for a 'private' group", function() {
            it("Should return an error if a non-member attempts to create a member with a role other than 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                    status: 'pending-requested',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:invalid')
            })

            it("Should return an error if a non-member attempts to create a member with a status other than 'pending-requested'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:invalid')
            })

            it("Should return an error if a non-member attempts to create a member for a user other than themselves", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `5c44ce06-1687-4709-b67e-de76c05acb6a`,
                    groupId: `8661a1ef-6259-4d5a-a59f-4d75929a765f`,
                    status: 'pending-requested',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:invalid')
            })

            it("Should allow a non-member to request access to a 'private' Group", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                    status: 'pending-requested',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // getGroupMemberByGroupAndUser
                    .mockReturnValueOnce({ rowCount: 0, rows: [] }) // permissionService.can -> getGroupMemberByGroupAndUser

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(0)
            })

            it("Should return an error if a moderator attemts to create a member with a role other than 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `8661a1ef-6259-4d5a-a59f-4d75929a765f`,
                    status: 'pending-invited',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['30d5291a-8df7-4c82-9508-ffa78a00217b'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)
                    .mockReturnValueOnce({ rowCount: 0, rows: database.groupMembers['30d5291a-8df7-4c82-9508-ffa78a00217b'].rows }) // permissionService.can -> getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe(`role:invalid`)
            })

            it("Should return an error if a moderator attempts to create a member with a status other than 'pending-invited'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `8661a1ef-6259-4d5a-a59f-4d75929a765f`,
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['30d5291a-8df7-4c82-9508-ffa78a00217b'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)
                    .mockReturnValueOnce({ rowCount: 0, rows: database.groupMembers['30d5291a-8df7-4c82-9508-ffa78a00217b'].rows }) // permissionService.can -> getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe(`status:invalid`)
            })

            it("Should allow a moderator member to invite non-members", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `8661a1ef-6259-4d5a-a59f-4d75929a765f`,
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['30d5291a-8df7-4c82-9508-ffa78a00217b'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(0)
            })

            it("Should thow an error if a non-moderator attempts to invite a non-member", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `8661a1ef-6259-4d5a-a59f-4d75929a765f`,
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '8661a1ef-6259-4d5a-a59f-4d75929a765f' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['0e1555d1-bccd-465d-85bc-4e3dbd4d29db'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)

                try {
                    const errors = await service.validateGroupMember(currentUser, groupMember, null)
                } catch (error) {
                    expect(error).toBeInstanceOf(ServiceError)
                    expect(error.type).toBe('invalid-permissions')
                }

                expect.hasAssertions()
            })
        })

        describe("for a 'hidden' group", function() {
            it("Should return an error if a moderator attempts to create a member with a role other than 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `4e66c241-ef21-4143-b7b4-c4fe81a34acd`,
                    status: 'pending-invited',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4e66c241-ef21-4143-b7b4-c4fe81a34acd' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['664390e9-88d2-4114-8018-0b428dd47907'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe(`role:invalid`)
            })

            it("Should return an error if a moderator attempts to create a member with a status other than 'pending-invited'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `4e66c241-ef21-4143-b7b4-c4fe81a34acd`,
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4e66c241-ef21-4143-b7b4-c4fe81a34acd' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['664390e9-88d2-4114-8018-0b428dd47907'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe(`status:invalid`)
            })

            it("Should allow a moderator member to invite non-members", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `4e66c241-ef21-4143-b7b4-c4fe81a34acd`,
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const groupRows = database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows
                const groupMemberRows = database.groupMembers['664390e9-88d2-4114-8018-0b428dd47907'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4e66c241-ef21-4143-b7b4-c4fe81a34acd' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows:  groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows:  groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, null)

                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(errors.length).toBe(0)
            })

            it("Should thow an error if a non-member attempts to invite a themselves", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `5c44ce06-1687-4709-b67e-de76c05acb6a`,
                    groupId: `4e66c241-ef21-4143-b7b4-c4fe81a34acd`,
                    status: 'pending-requested',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4e66c241-ef21-4143-b7b4-c4fe81a34acd' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: [] }) // getGroupMemberByGroupAndUser(group, currentUser)
                    .mockReturnValueOnce({ rowCount: 1, rows: [] }) // getGroupMemberByGroupAndUser(group, currentUser)

                try {
                    const errors = await service.validateGroupMember(currentUser, groupMember, null)
                } catch (error) {
                    expect(error).toBeInstanceOf(ServiceError)
                    expect(error.type).toBe('invalid-permissions')
                }

                expect.hasAssertions()
            })

            it("Should thow an error if a non-moderator attempts to invite a non-member", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                    groupId: `4e66c241-ef21-4143-b7b4-c4fe81a34acd`,
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '4e66c241-ef21-4143-b7b4-c4fe81a34acd' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['eee01f25-8669-4119-bcf6-4cd3eb3c4f26'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)

                try {
                    const errors = await service.validateGroupMember(currentUser, groupMember, null)
                } catch (error) {
                    expect(error).toBeInstanceOf(ServiceError)
                    expect(error.type).toBe('invalid-permissions')
                }

                expect.hasAssertions()
            })

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
                id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                status: 'member',
                role: 'member'
            }

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
            const existing = entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows }) // getGroupById
                .mockReturnValueOnce({ rowCount: 1, rows: database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows }) // getGroupMemberByGroupAndUser(group, currentUser)

            const errors = await service.validateGroupMember(currentUser, groupMember, existing)

            expect(errors.length).toBe(0)
        })

        it("Should throw an error for an existing GroupMember with a status other than 'member', 'pending-invited', or 'pending-requested'", async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                status: 'member',
                role: 'member'
            }

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
            const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
            existing.status = 'admin'

            const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
            const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

            try {
                const errors = await service.validateGroupMember(currentUser, groupMember, existing)
            } catch (error ) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-status')
            }

            expect.hasAssertions()
        })

        it("Should throw an error for an existing GroupMember with a role other than 'member', 'moderator', or 'admin'", async function() {
            const service = new ValidationService(core)

            const groupMember = { 
                id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                status: 'member',
                role: 'member'
            }

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
            const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
            existing.role = 'superadmin'

            const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
            const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

            try {
                const errors = await service.validateGroupMember(currentUser, groupMember, existing)
            } catch (error ) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('invalid-role')
            }

            expect.hasAssertions()
        })

        describe("for a GroupMember with status 'pending-invited'", function() {
            it("Should not allow the member to change their status to 'pending-requested'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'pending-requested',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'pending-invited'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:invalid')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).toBe(groupMember.userId)
            })

            it("Should not allow anyone other than the member to change their status", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'pending-invited'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['a9e18581-0826-491a-835a-751bcfc228a8'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:invalid')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).not.toBe(groupMember.userId)

            })

            it("Should allow the member to change their status to 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'pending-invited'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).toBe(groupMember.userId)
            })

            it("Should pass an unchanged status", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).toBe(groupMember.userId)

            })
        })

        describe("for a GroupMember with status 'pending-requested'", function() {
            it("Should not allow the member to change their status", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'pending-requested'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).toBe(groupMember.userId)
            })

            it("Should not allow a moderator to change their status to 'pending-invited'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'pending-invited',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'pending-requested'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:invalid')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should allow a moderator to change their status to 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'pending-requested'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).not.toBe(groupMember.userId)
            })


            it("Should pass an unchanged status", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.status = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(currentUser.id).toBe(groupMember.userId)

            })
        })

        describe("for a GroupMember with status 'member'", function() {
            describe("and role 'member'", function() {
                it("Should not allow the member to change their status", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'member'
                    }

                    const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).not.toBe('moderator')
                    expect(currentUser.id).toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'pending-requested'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-requested',
                        role: 'member'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'pending-requested'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-requested',
                        role: 'member'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'pending-invited'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'member'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'pending-invited'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'member'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should allow a moderator to change their status to 'banned'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'banned',
                        role: 'member'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(0)
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)

                })

                it("Should allow an admin to change their status to 'banned'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'banned',
                        role: 'member'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(0)
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)

                })
            })

            describe("and role 'moderator'", function() {
                it("Should not allow the member to change their status", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'moderator'
                    }

                    const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'moderator'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).not.toBe('moderator')
                    expect(currentUser.id).toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'pending-requested'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-requested',
                        role: 'moderator'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'moderator'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'pending-requested'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-requested',
                        role: 'moderator'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'moderator'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'pending-invited'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'moderator'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'moderator'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'pending-invited'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'moderator'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'moderator'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'banned'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'banned',
                        role: 'moderator'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'moderator'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:not-authorized')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'banned'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'banned',
                        role: 'moderator'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'moderator'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:not-authorized')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })
            })

            describe("and role 'admin'", function() {
                it("Should not allow the member to change their status", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'admin'
                    }

                    const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'admin'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).not.toBe('moderator')
                    expect(currentUser.id).toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'pending-requested'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-requested',
                        role: 'admin'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'admin'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'pending-requested'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-requested',
                        role: 'admin'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'admin'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'pending-invited'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'admin'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'admin'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'pending-invited'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'pending-invited',
                        role: 'admin'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'admin'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:invalid')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow a moderator to change their status to 'banned'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'banned',
                        role: 'admin'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'admin'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:not-authorized')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

                it("Should not allow an admin to change their status to 'banned'", async function() {
                    const service = new ValidationService(core)

                    const groupMember = { 
                        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                        status: 'banned',
                        role: 'admin'
                    }

                    const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                    const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                    existing.status = 'member'
                    existing.role = 'admin'

                    const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                    const currentMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                    core.database.query.mockReturnValue(undefined)
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                        .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                        .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                        .mockReturnValueOnce({ rowCount: 1, rows: currentMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                    const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                    expect(errors.length).toBe(1)
                    expect(errors[0].type).toBe('status:not-authorized')
                    expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                    expect(currentMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                    expect(currentMemberRows[0].GroupMember_role).toBe('admin')
                    expect(currentUser.id).not.toBe(groupMember.userId)
                })

            })
        })


        describe("for a GroupMember with role 'member'", function() {
            it("Should not allow an admin to change member's role to something other than 'admin' or 'moderator'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'superadmin'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:invalid')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should allow an admin to change member's role to 'moderator'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should allow an admin to change member's role to 'admin'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'admin'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow a moderator to change member's role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow a member to change member's role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['a9e18581-0826-491a-835a-751bcfc228a8'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('member')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow a member to change their own role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'moderator'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'member'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('member')
                expect(currentUser.id).toBe(groupMember.userId)
            })

        })

        describe("for a GroupMember with role 'moderator'", function() {
            it("Should not allow an admin to change member's role to something other than 'member' or 'moderator'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'superadmin'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'moderator'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:invalid')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should allow an admin to change moderators's role to 'member'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'moderator'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should allow an admin to change moderator's role to 'admin'", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'admin'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'moderator'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(0)
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow a moderator to change moderator's role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'moderator'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow a member to change moderator's role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'moderator'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['a9e18581-0826-491a-835a-751bcfc228a8'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('member')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow a member to change their own role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'admin'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'moderator'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('member')
                expect(currentUser.id).toBe(groupMember.userId)
            })

        })

        describe("for a GroupMember with role 'admin'", function() {
            it("Should not allow a moderator to change an admin's role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'admin'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['bb88818d-6426-4e5a-b79a-688a700fef11'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('moderator')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow a member to change an admin's role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'admin'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['a9e18581-0826-491a-835a-751bcfc228a8'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('member')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow an admin to change an admin's role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['2a7ae011-689c-4aa2-8f13-a53026d40964']
                const existing = { ...entities.groupMembers.dictionary['138de5fc-a0a9-47eb-ac51-3c92f7780ad9'] }
                existing.role = 'admin'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['fef5f5a1-b500-4694-a5ca-c7ebea359295'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).not.toBe(groupMember.userId)
            })

            it("Should not allow an admin to change their own role", async function() {
                const service = new ValidationService(core)

                const groupMember = { 
                    id: '684f7a9f-d415-48a3-be9b-2cd953da47f5',
                    userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                    groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                    status: 'member',
                    role: 'member'
                }

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']
                const existing = { ...entities.groupMembers.dictionary['684f7a9f-d415-48a3-be9b-2cd953da47f5'] }
                existing.role = 'admin'

                const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
                const groupMemberRows = database.groupMembers['684f7a9f-d415-48a3-be9b-2cd953da47f5'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]}) // Check user existence
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]}) // Check group existence.
                    .mockReturnValueOnce({ rowCount: 1, rows: groupRows }) // getGroupById
                    .mockReturnValueOnce({ rowCount: 1, rows: groupMemberRows }) // getGroupMemberByGroupAndUser(group, currentUser)

                const errors = await service.validateGroupMember(currentUser, groupMember, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('role:not-authorized')
                expect(groupRows[0].Group_id).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_groupId).toBe(groupMember.groupId)
                expect(groupMemberRows[0].GroupMember_userId).toBe(currentUser.id)
                expect(groupMemberRows[0].GroupMember_role).toBe('admin')
                expect(currentUser.id).toBe(groupMember.userId)
            })


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
                userId: `f5e9e853-6803-4a74-98c3-23fb0933062f`,
                groupId: `aeb26ec5-3644-4b7a-805e-375551ec65b6`,
                status: 'member',
                role: 'member'
            }

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }]})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6' }]})
                .mockReturnValueOnce({ rowCount: 1, rows: database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })
                .mockReturnValueOnce({ rowCount: 0, rows: [] })

            const errors = await service.validateGroupMember(currentUser, groupMember, null)

            expect(errors.length).toBe(0)
        })
    })
})
