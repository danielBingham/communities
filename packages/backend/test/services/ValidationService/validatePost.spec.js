const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')
const database = require('../../fixtures/database')

describe('ValidationService.validatePost()', function() {
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

    it('Should return one error for each disallowed field included (activity, createdDate, updatedDate)', async function() {
        const service = new ValidationService(core)
    
        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const post = {
            userId: currentUser.id,
            type: 'feed',
            visibility: 'private',
            activity: 10,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }

        const errors = await service.validatePost(currentUser, post, undefined)

        expect(errors.length).toBe(3)
    })

    it('Should treat `null` as set for disallowed fields', async function() {
        const service = new ValidationService(core)

        const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

        const post = {
            userId: currentUser.id,
            type: 'feed',
            visibility: 'private',
            activity: null,
            createdDate: null,
            updatedDate: null
        }

        const errors = await service.validatePost(currentUser, post, undefined)

        expect(errors.length).toBe(3)
    })

    describe('when creating a post', function() {
        it('Should return errors if any required fields are missing', async function() { 
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = {
                type: 'feed',
                visibility: 'private'
            }

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('userId:required')
        })

        it('Should return one error for each required field (type, userId, visibility) missing', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { }

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(3)
        })
    })

    describe('when editing a post', function() {
        it('Should return one error for each disallowed field (type, userId, groupId)', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                id: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e',
                type: 'group',
                userId: 'af96f77e-7f20-4441-be85-5dc0dc4bef71',
                groupId: 'f4a8af68-c0a5-4896-b44b-01de935a5c7f'
            }

            const existing = entities['posts'].dictionary['789307dc-fe1f-4d57-ad88-1ecbb8a38a4e']

            const errors = await service.validatePost(currentUser, post, existing)

            expect(errors.length).toBe(3)
        })

        it('Should treat `null` as set for disallowed fields', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                id: 'b75c5eae-fc6a-4056-9674-279e13076f42',
                type: null,
                userId: null,
                groupId: null 
            }

            const existing = entities['posts'].dictionary['b75c5eae-fc6a-4056-9674-279e13076f42']

            const errors = await service.validatePost(currentUser, post, existing)

            // "not-allowed" and "null" for both userId and type, "not-allowed" for groupId
            expect(errors.length).toBe(5)
        })

        it('Should throw an error if post.id and existing.id do not match', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                id: '703955d2-77df-4635-8ab8-b9108fef217f'
            }

            const existing = entities['posts'].dictionary['63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d']

            try { 
                const errors = await service.validatePost(currentUser, post, existing)
            } catch (thrownError) {
                expect(thrownError).toBeInstanceOf(ServiceError)
                expect(thrownError.type).toBe('entity-mismatch')
            }

            expect.hasAssertions()
        })
    })

    describe('when posting to a group', function() {
        it('should require the `groupId` to be set', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                visibility: 'public'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]})

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('groupId:missing')

        })

        it('should error if it can not find the group', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                visibility: 'public'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('groupId:not-found')

        })

        it('should error if a private post is made to an open group', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                visibility: 'private'
            }

            const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '5c44ce06-1687-4709-b67e-de76c05acb6a' }]})
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('visibility:invalid')
        })

        it('should error if a public post is made to a private group', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: currentUser.id,
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                visibility: 'public'
            }

            const groupRows = database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('visibility:invalid')

        })

        it('should error if a public post is made to a hidden group', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: currentUser.id,
                groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                visibility: 'public'
            }

            const groupRows = database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('visibility:invalid')

        })

        it('should pass a public post made to an open group', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: currentUser.id,
                groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                visibility: 'public'
            }

            const groupRows = database.groups['aeb26ec5-3644-4b7a-805e-375551ec65b6'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(0)
        })

        it('should pass a private post made to a private group', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: currentUser.id,
                groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                visibility: 'private'
            }

            const groupRows = database.groups['8661a1ef-6259-4d5a-a59f-4d75929a765f'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(0)
        })

        it('should pass a private post made to a hidden group', async function() {
            const service = new ValidationService(core)

            const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const post = { 
                type: 'group',
                userId: currentUser.id,
                groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                visibility: 'private'
            }

            const groupRows = database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows
            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows })

            const errors = await service.validatePost(currentUser, post, undefined)

            expect(errors.length).toBe(0)
        })
    })

    describe('always', function() {
        describe('validate type', function() {
            it('Should return an error when type is null', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: null,
                    userId: currentUser.id,
                    visibility: 'public'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('type:null')
            })

            it('Should return an error when type is not a string', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 10,
                    userId: currentUser.id,
                    visibility: 'public'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('type:invalid-type')
            })

            it('Should return an error for an invalid type', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'event',
                    userId: currentUser.id,
                    visibility: 'public'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('type:invalid')
            })

            it('Should pass a post with valid type `feed`', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'public'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })

            it('Should pass a post with valid type `group`', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'group',
                    userId: currentUser.id,
                    groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                    visibility: 'private'
                }

                const groupRows = database.groups['4e66c241-ef21-4143-b7b4-c4fe81a34acd'].rows
                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: groupRows.length, rows: groupRows})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })
        })

        describe('validate visibility', function() {
            it('Should return an error when visibility is null', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: null 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('visibility:null')
            })

            it('Should return an error when visibility is not a string', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 10 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('visibility:invalid-type')
            })

            it('Should return an error for an invalid visibility', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'hidden'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('visibility:invalid')
            })

            it('Should pass a post with valid visibility `public`', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'public'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })

            it('Should pass a post with valid visibility `private`', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })
        })

        describe('for userId', function () {
            it('Should error for `null` userIds', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: null,
                    visibility: 'private' 
                }

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:null')
            })

            it('Should error when userId is no a valid UUID', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: 'test',
                    visibility: 'private' 
                }

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:invalid')
            })

            it('Should error when User(userId) is not found', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 0, rows: []})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('userId:not-found')
            })

            it('Should pass a valid UUID with a found User', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })
        })

        describe('for fileId', function() {
            it('Should error for an invalid UUID', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    fileId: 'test'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('fileId:invalid')
            })

            it('Should error for a File not found', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    fileId: 'a7a80c5f-2837-4080-a813-e66e6157124c'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: []})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('fileId:not-found')
            })

            it('Should error if linkPreviewId is also set', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    fileId: 'a7a80c5f-2837-4080-a813-e66e6157124c',
                    linkPreviewId: '84c03e4d-1c07-49b1-a3a4-078cf8a03c66'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '84c03e4d-1c07-49b1-a3a4-078cf8a03c66' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(2)
                expect(errors[0].type).toBe('fileId:conflict')
                expect(errors[1].type).toBe('linkPreviewId:conflict')
            })

            it('Should error if sharedPostId is also set', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    fileId: 'a7a80c5f-2837-4080-a813-e66e6157124c',
                    sharedPostId: '84c03e4d-1c07-49b1-a3a4-078cf8a03c66'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: '84c03e4d-1c07-49b1-a3a4-078cf8a03c66', visibility: 'public' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(2)
                expect(errors[0].type).toBe('fileId:conflict')
                expect(errors[1].type).toBe('sharedPostId:conflict')
            })

            it('Should pass a `null` fileId', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    fileId: null 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })

            it('Should pass a valid fileId with a found File', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    fileId: 'a7a80c5f-2837-4080-a813-e66e6157124c'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })
        })

        describe('for linkPreviewId', function() {
            it('Should error for an invalid UUID', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    linkPreviewId: 'test',
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('linkPreviewId:invalid')
            })

            it('Should error for a LinkPreview not found', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    linkPreviewId: 'a7a80c5f-2837-4080-a813-e66e6157124c',
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: []})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('linkPreviewId:not-found')
            })

            it('Should error when linkPreviewId and fileID are both set', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    linkPreviewId: 'a7a80c5f-2837-4080-a813-e66e6157124c',
                    fileId: '21a44cd9-4141-43a3-aae3-93735bcb6a32' 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: '21a44cd9-4141-43a3-aae3-93735bcb6a32' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(2)
                expect(errors[0].type).toBe('fileId:conflict')
                expect(errors[1].type).toBe('linkPreviewId:conflict')
            })

            it('Should error when linkPreviewId and sharedPostId are both set', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    linkPreviewId: 'a7a80c5f-2837-4080-a813-e66e6157124c',
                    sharedPostId: '21a44cd9-4141-43a3-aae3-93735bcb6a32' 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: '21a44cd9-4141-43a3-aae3-93735bcb6a32', visibility: 'public' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(2)
                expect(errors[0].type).toBe('linkPreviewId:conflict')
                expect(errors[1].type).toBe('sharedPostId:conflict')
            })

            it('Should pass when linkPreviewId is `null`', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    linkPreviewId: null 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })

            it('Should pass when LinkPreview is valid and found', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    linkPreviewId: 'a7a80c5f-2837-4080-a813-e66e6157124c'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })
        })

        describe('for sharedPostId', function() {
            it('Should error for an invalid UUID', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    sharedPostId: 'test',
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('sharedPostId:invalid')
            })

            it('Should error for a LinkPreview not found', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    sharedPostId: 'a7a80c5f-2837-4080-a813-e66e6157124c',
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: []})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('sharedPostId:not-found')
            })

            it('Should error when sharedPostId and fileID are both set', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    sharedPostId: 'a7a80c5f-2837-4080-a813-e66e6157124c',
                    fileId: '21a44cd9-4141-43a3-aae3-93735bcb6a32' 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: '21a44cd9-4141-43a3-aae3-93735bcb6a32', visibility: 'public' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(2)
                expect(errors[0].type).toBe('fileId:conflict')
                expect(errors[1].type).toBe('sharedPostId:conflict')
            })

            it('Should error when sharedPostId and sharedPostId are both set', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    linkPreviewId: '21a44cd9-4141-43a3-aae3-93735bcb6a32',
                    sharedPostId: 'a7a80c5f-2837-4080-a813-e66e6157124c'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c' }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: '21a44cd9-4141-43a3-aae3-93735bcb6a32', visibility: 'public' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(2)
                expect(errors[0].type).toBe('linkPreviewId:conflict')
                expect(errors[1].type).toBe('sharedPostId:conflict')
            })

            it('Should pass when sharedPostId is `null`', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    sharedPostId: null 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })

            it('Should pass when Post is valid and found', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    sharedPostId: 'a7a80c5f-2837-4080-a813-e66e6157124c'
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})
                    .mockReturnValueOnce({ rowCount: 0, rows: [{ id: 'a7a80c5f-2837-4080-a813-e66e6157124c', visibility: 'public' }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(0)
            })
        })

        describe('for content', function() {
            it('Should error when content is not a string', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    content: 10
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('content:invalid-type')
            })

            it('Should error when content is longer than 10,000 characters', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    content: `
                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.`
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('content:too-long')
            })

            it('Should error when content is `null`', async function() {
                const service = new ValidationService(core)

                const currentUser = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

                const post = { 
                    type: 'feed',
                    userId: currentUser.id,
                    visibility: 'private',
                    content: null 
                }

                core.database.query.mockReturnValue(undefined)
                    .mockReturnValueOnce({ rowCount: 1, rows: [{ id: currentUser.id }]})

                const errors = await service.validatePost(currentUser, post, undefined)

                expect(errors.length).toBe(1)
                expect(errors[0].type).toBe('content:null')
            })
        })
    })
})
