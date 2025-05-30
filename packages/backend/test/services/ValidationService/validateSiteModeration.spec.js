const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validateSiteModeration()', function() {
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

        const siteModeration = { 
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const errors = await service.validateSiteModeration(null, siteModeration, null)

        expect(errors.length).toBe(2)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const siteModeration = { 
            createdDate: null,
            updatedDate: null
        }

        const errors = await service.validateSiteModeration(null, siteModeration, null)

        expect(errors.length).toBe(2)
    })

    describe('when creating', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const siteModeration = { 
                status: 'flagged',
                postId: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e'
            }

            const errors = await service.validateSiteModeration(null, siteModeration, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:missing')
        })

        it('Should return one error for each required field (userId, status) missing', async function() {
            const service = new ValidationService(core)

            const siteModeration = { 
                postId: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e'
            }

            const errors = await service.validateSiteModeration(null, siteModeration, null)

            expect(errors.length).toBe(2)
        })

        it('Should return an error if both `postId` and `postCommentId` are missing', async function() {
            const service = new ValidationService(core)

            const siteModeration = { 
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a', 
                status: 'flagged'
            }

            const errors = await service.validateSiteModeration(null, siteModeration, null)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('entityId:missing')
        })
    })

    describe('when editing', function() {
        it('Should return an error if both `postId` and `postCommentId` are missing', async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const siteModeration = { 
                userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f', 
                status: 'approved'
            }

            // Moderator User approving Private Post to a feed by User One
            const existing = entities.siteModeration.dictionary['3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2']

            const errors = await service.validateSiteModeration(currentUser, siteModeration, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('entityId:missing')
        })

        it('Should throw an error when siteModeration.id does not match existing.id', async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const siteModeration = { 
                id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f', 
                status: 'approved'
            }

            // Moderator User approving Private Post to a feed by User One
            const existing = entities.siteModeration.dictionary['3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2']

            try {
                const errors = await service.validateSiteModeration(currentUser, siteModeration, existing)
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })

        it("Should return an error if `siteModeration.postId` does not match `existing.postId`", async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const siteModeration = { 
                userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                status: 'approved',
                postId: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e'
            }

            // Moderator User approving Private Post to a feed by User One
            const existing = entities.siteModeration.dictionary['3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2']

            const errors = await service.validateSiteModeration(currentUser, siteModeration, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('postId:not-allowed')
        })

        it("Should return an error if `siteModeration.postCommentId` does not match `existing.postCommentId`", async function() {
            const service = new ValidationService(core)

            // Moderator User
            const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

            const siteModeration = { 
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a', 
                status: 'flagged',
                postCommentId: '083e69ca-b9eb-4d30-a56b-5ddb870d5b4b'
            }

            // User One flagging a comment. 
            const existing = entities.siteModeration.dictionary['e79ffadc-7d14-4ce5-aca4-8305677023b3']

            const errors = await service.validateSiteModeration(currentUser, siteModeration, existing)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('postCommentId:not-allowed')
        })
    })

    describe('always', function() {
        describe('validate userId', function() {
            it("Should return an error when `userId` is `null`", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: null,
                    status: 'flagged',
                    postId: '1457275b-5230-473a-8558-ffce376d77ac'
                }

                const existing = entities.siteModeration.dictionary['3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2']

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '1457275b-5230-473a-8558-ffce376d77ac' }]})

                const errors = await service.validateSiteModeration(currentUser, siteModeration, existing)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:missing')
            })

            it("Should return an error when `userId` is not a string", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 1,
                    status: 'flagged',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }]})

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:invalid-type')
            })

            it("Should return an error when `userId` is not a valid uuid", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'test-string',
                    status: 'flagged',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }]})

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:invalid')
            })

            it("Should return an error when `userId` does not correspond to a user", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 0, rows: [] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }]})

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:not-found')
            })

            it("Should pass a correct userId with a valid user", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })
        })

        describe("validate status", function() {
            it("Should return an error when `status` is `null`", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: null,
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:missing')
            })

            it("Should return an error when `status` is not a string", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 10,
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:invalid-type')
            })

            it("Should return an error when `status` is not a valid status", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'removed',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('status:invalid')
            })

            it("Should pass a valid 'approved' status", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'approved',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })

            it("Should pass a valid 'rejected' status", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'rejected',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })

            it("Should pass a valid 'flagged' status", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })
        })

        describe('validate reason', function() {
            it("Should return an error when `reason` is not a string", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    reason: 10,
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('reason:invalid-type')
            })

            it("Should pass whenh `reason` is `null`", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    reason: null,
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })

            it("Should pass when `reason` is a valid string", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    reason:  'Test reason!',
                    postId: '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })
        })

        describe('validate postId', function() {
            it("Should return an error when postId is not a string", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postId: 10 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('postId:invalid-type')
            })

            it("Should return an error when postId is not a valid uuid", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postId:  'test-id' 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('postId:invalid')
            })

            it("Should error when postId does not correspond to a post", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postId:  '703955d2-77df-4635-8ab8-b9108fef217f' 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 0, rows: [] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('postId:not-found')
            })

            it("Should pass a valid postId", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postId:  '703955d2-77df-4635-8ab8-b9108fef217f'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '703955d2-77df-4635-8ab8-b9108fef217f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })
        })

        describe('validate postCommentId', function() {
            it("Should error when postCommentId is not a string", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postCommentId: 10 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('postCommentId:invalid-type')
            })

            it("Should error when postCommentId is not a valid-uuid", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postCommentId: 'test-id' 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('postCommentId:invalid')
            })

            it("Should error when postCommentId does not correspond to a valid PostComment", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postCommentId: 'dea0084d-b034-4d74-a1c1-f0f17abd5f9e' 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 0, rows: [] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('postCommentId:not-found')
            })

            it("Should pass a valid postCommentId", async function() {
                const service = new ValidationService(core)

                // Moderator User
                const currentUser = entities.users.dictionary['f5e9e853-6803-4a74-98c3-23fb0933062f']

                const siteModeration = { 
                    userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                    status: 'flagged',
                    postCommentId: 'dea0084d-b034-4d74-a1c1-f0f17abd5f9e'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'f5e9e853-6803-4a74-98c3-23fb0933062f' }] })
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'dea0084d-b034-4d74-a1c1-f0f17abd5f9e' }] })

                const errors = await service.validateSiteModeration(currentUser, siteModeration, null)

                expect(errors.length).toBe(0)
            })
        })
    })
})
