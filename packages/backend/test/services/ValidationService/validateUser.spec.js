const Logger = require('../../../logger')
const FeatureFlags = require('../../../features')

const ServiceError = require('../../../errors/ServiceError')
const ValidationService = require('../../../services/ValidationService')

const entities = require('../../fixtures/entities')

describe('ValidationService.validateUser()', function() {

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

    it('Should return one error for each invalid field set', async function() {
        const service = new ValidationService(core)

        const user = {
            permissions: 'set',
            invitations: 10,
            createdDate: 'set',
            updatedDate: 'set'
        }

        const errors = await service.validateUser(user, null, null)

        expect(errors.length).toBe(4)
    })

    it('Should treat an invalid field set to `null` as set', async function() {
        const service = new ValidationService(core)

        const user = {
            permissions: null,
            invitations: null,
            createdDate: null,
            updatedDate: null
        }

        const errors = await service.validateUser(user, null, null)

        expect(errors.length).toBe(4)
    })

    it('Should error on any combination of set invalid fields', async function() {
        const service = new ValidationService(core)

        const user = {
            invitations: 10,
            updatedDate: null
        }

        const errors = await service.validateUser(user, null, null)

        expect(errors.length).toBe(2)
    })

    describe('an invitation', function() {
        it('should only allow email to be set', async function() {
            const service = new ValidationService(core)

            const user = {
                fieldId: 'set',
                name: 'set',
                username: 'set',
                password: 'set',
                settings: {},
                notices: {},
                about: 'set',
                location: 'set',
                status: 'set'
            }

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(9)

        })

        it('should require email to be set', async function() {
            const service = new ValidationService(core)

            const user = { }

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('email:missing')

        })

        it('should pass a valid email', async function() {
            const service = new ValidationService(core)

            const user = { 
                email: 'test@test.com' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(0)

        })
    })

    describe('a reinvitation', function() {
        it('should only allow email to be set', async function() {
            const service = new ValidationService(core)

            const user = {
                fieldId: 'set',
                name: 'set',
                username: 'set',
                password: 'set',
                settings: {},
                notices: {},
                about: 'set',
                location: 'set',
                status: 'set'
            }

            const errors = await service.validateUser(user, null, 'reinvitation')

            expect(errors.length).toBe(9)

        })

        it('should require email to be set', async function() {
            const service = new ValidationService(core)

            const user = { }

            const errors = await service.validateUser(user, null, 'reinvitation')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('email:missing')

        })

        it('should pass a valid email', async function() {
            const service = new ValidationService(core)

            const user = { 
                email: 'test@test.com' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'reinvitation')

            expect(errors.length).toBe(0)
        })
    })

    describe('a registration', function() {
        it('Should not let you set `settings`, `notices`, or `status`', async function() {
            const service = new ValidationService(core)

            const user = {
                settings: {},
                notices: {},
                status: 'confirmed',
                email: 'test@test.com',
                name: 'Valid Name',
                username: 'valid-username',
                password: 'PasswordPassword'

            }

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(3)
        })

        it('Should treat `null` as set for `settings`, `status`, or `notices`', async function() {
            const service = new ValidationService(core)

            const user = {
                settings: null,
                notices: null,
                status: null,
                email: 'test@test.com',
                name: 'Valid Name',
                username: 'Valid Username',
                password: 'PasswordPassword'
            }

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(3)
        })

        it('Should not let you set email, name, username, or password to `null`', async function() {
            const service = new ValidationService(core)

            const user = {
                email: null,
                name: null,
                username: null,
                password: null
            }

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(4)
        })

        it('Should pass a valid user', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'User Name',
                username: 'user-name',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(0)
        })
    })

    describe('an invitation acceptance', function() {
        it('Should not let you set `settings`, `status`, or `notices`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                settings: {},
                notices: {},
                email: 'test@test.com',
                name: 'Valid Name',
                username: 'valid-username',
                password: 'PasswordPassword',
                status: 'confirmed'

            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'invitation-acceptance')

            expect(errors.length).toBe(3)
        })

        it('Should treat `null` as set for `settings`, `status`, or `notices`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                settings: null,
                notices: null,
                email: 'test@test.com',
                name: 'Valid Name',
                username: 'Valid Username',
                password: 'PasswordPassword',
                status: null
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'invitation-acceptance')

            expect(errors.length).toBe(3)
        })

        it('Should require `email`, `name`, `username`, and `password`', async function() {
            const service = new ValidationService(core)

            const user = { 
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'invitation-acceptance')

            expect(errors.length).toBe(4)
        })

        it('Should not let you set email, name, username, or password to `null`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                email: null,
                name: null,
                username: null,
                password: null
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'invitation-acceptance')

            expect(errors.length).toBe(4)
        })

        it('Should pass a valid user', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                email: 'test@test.com',
                name: 'User Name',
                username: 'user-name',
                password: 'passwordpassword' 
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, existing, 'invitation-acceptance')

            expect(errors.length).toBe(0)
        })

    })

    describe('a password reset', function() {
        it('Should not let you set `settings`, `notices`, `email`, `name`, `status`, or `username`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                settings: {},
                notices: {},
                name: 'Valid User',
                username: 'valid.user',
                email: 'valid.user@mailinator.com',
                password: 'PasswordPassword',
                status: 'confirmed'

            }

            const existing = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a'] 

            const errors = await service.validateUser(user, existing, 'password-reset')

            expect(errors.length).toBe(6)
        })

        it('Should treat `null` as set for `settings`, `notices`, `email`, `name`, `status`, or `username`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                settings: null,
                notices: null,
                name: null,
                username: null,
                email: null,
                password: 'PasswordPassword',
                status: null
            }

            const existing = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const errors = await service.validateUser(user, existing, 'password-reset')

            expect(errors.length).toBe(6)
        })

        it('Should pass a valid user with a password', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                password: 'passwordpassword' 
            }

            const existing = entities['users'].dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']

            const errors = await service.validateUser(user, existing, 'password-reset')

            expect(errors.length).toBe(0)
        })
    })

    describe('an authenticated edit', function() {
        it('Should not let you set `username` or `status`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                username: 'valid-username',
                status: 'confirmed'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'authenticated-edit')

            expect(errors.length).toBe(2)
        })

        it('Should treat `null` as set for `username` and `status`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                username: 'valid-username',
                status: 'confirmed'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'authenticated-edit')

            expect(errors.length).toBe(2)
        })

        it('Should allow you to set email', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                email: 'test@test.com'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, existing, 'authenticated-edit')

            expect(errors.length).toBe(0)
        })

        it('Should allow you to set password', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                password: 'passwordpassword'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'authenticated-edit')

            expect(errors.length).toBe(0)
        })

        it('Should allow you to set any valid fields', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                email: 'test@test.com',
                name: 'User Name',
                about: 'Test about',
                fileId: null,
                settings: {},
                notices: {},
                password: 'passwordpassword'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, existing, 'authenticated-edit')

            expect(errors.length).toBe(0)
        })
    })

    describe('an admin edit', function() {
        it('Should not let you set `username`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                username: 'valid-username'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:not-allowed')
        })

        it('Should treat `null` as set for `username`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                username: 'valid-username'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:not-allowed')
        })

        it('Should allow you to set email', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                email: 'test@test.com'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(0)
        })

        it('Should allow you to set password', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                password: 'passwordpassword'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(0)
        })

        it('Should allow you to set status to banned for confirmed users', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                status: 'banned'
            }

            const existing = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a'] 

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(0)
        })

        it('Should allow you to set status to confirmed for banned users', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                status: 'confirmed'
            }

            const existing = { ...entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a'] }
            existing.status = 'banned'

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(0)
        })

        it('Should allow you to set any valid fields', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                email: 'test@test.com',
                name: 'User Name',
                about: 'Test about',
                fileId: null,
                settings: {},
                notices: {},
                password: 'passwordpassword'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(0)
        })
    })

    describe('an edit', function() {
        it('Should not let you set `username`, `email`, `status`, or `password`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                username: 'valid-username',
                email: 'valid@email.com',
                password: 'passwordpassword',
                status: 'confirmed'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(4)
        })

        it('Should treat `null` as set for `username`, `email`, `status`, or `password`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                username: 'valid-username',
                email: 'valid@email.com',
                password: 'passwordpassword',
                status: 'status'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(4)
        })

        it('Should allow you to set any valid fields', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                name: 'User Name',
                about: 'Test about',
                fileId: null,
                settings: {},
                notices: {}
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(0)
        })
    })

    describe('for emails', function() {
        it('should require email to be not `null`', async function() {
            const service = new ValidationService(core)

            const user = { 
                email: null
            }

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('email:missing')

        })

        it('should error on a non-string email', async function() {
            const service = new ValidationService(core)

            const user = { 
                email: 1 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('email:invalid-type')

        })

        it('should error on an invalid email', async function() {
            const service = new ValidationService(core)

            const user = { 
                email: 'set' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('email:invalid')

        })

        it('should error on an email conflict', async function() {
            const service = new ValidationService(core)

            const user = { 
                email: 'test@test.com' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: '1', email: 'test@test.com' }]})

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('email:conflict')

        })

        it('should pass a valid email', async function() {
            const service = new ValidationService(core)

            const user = { 
                email: 'test@test.com' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'invitation')

            expect(errors.length).toBe(0)

        })
    })

    describe('for name', function() {
        it('should not allow `null` values', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: null,
                username: 'user-name',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('name:missing')
        })

        it('should only accept `string` values', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 10,
                username: 'user-name',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('name:invalid-type')
        })

        it('should error on values that are more than 512 characters', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 
                username: 'user-name',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('name:too-long')
        })

        it('should pass on valid names', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name',
                username: 'user-name',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(0)
        })
    })

    describe('for username', function() {
        it('should not allow `null` values', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name',
                username: null,
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:missing')
        })

        it('should only accept `string` values', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name',
                username: 10,
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:invalid-type')
        })

        it('should error on values that are more than 512 characters', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:too-long')
        })

        it('should error on values that are contain spaces', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'Invalid Username',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:invalid')
        })

        it('should error on values that are contain invalid characters', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'Invalid%Username/',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:invalid')
        })

        it('should error when a username is already in use', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'valid-username',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 1, rows: [{ id: 1, username: 'valid-username' }]})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:conflict')
        })

        it('should reject usernames that start with a hyphen', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: '-invalid-username',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:invalid')
        })

        it('should reject usernames that start with an underscore', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: '_invalid-username',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:invalid')
        })

        it('should reject usernames that start with a number', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: '0invalid-username',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('username:invalid')
        })

        it('should pass usernames that start with a letter and contain only letters, numbers, and .-_', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'valid_user-name98',
                password: 'passwordpassword' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(0)
        })
    })

    describe('for password', function() {
        it('should error when a password is `null`', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'valid-username',
                password: null 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 1, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('password:missing')
        })

        it('should error when a password is not a `string`', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'valid-username',
                password: 10 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('password:invalid-type')
        })

        it('should error when a password is less than 12 characters', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'valid-username',
                password: 'tooshort' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('password:too-short')
        })

        it('should error when a password is more than 256 characters', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'valid-username',
                password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' 
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('password:too-long')
        })

        it('should pass with a valid password', async function() {
            const service = new ValidationService(core)

            const user = {
                email: 'test@test.com',
                name: 'Valid Name', 
                username: 'valid-username',
                password: 'PasswordPassword'
            }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: []})
                .mockReturnValueOnce({ rowCount: 0, rows: []})

            const errors = await service.validateUser(user, null, 'registration')

            expect(errors.length).toBe(0)
        })
    })

    describe('for about', function() {
        it('should error when `about` is null', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                about: null 
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('about:missing')
        })

        it('should error when a about is not a `string`', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                about: 10 
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('about:invalid-type')
        })

        it('should error when a about is longer than 1024 characters', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                about: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' 
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('about:too-long')
        })

        it('should pass when about is valid', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                about: "I'm a user.  I do things."
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(0)
        })
    })

    describe('for fileId', function() {
        it('should error when fileId is not a valid uuid', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                fileId: 'test'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('fileId:invalid')

        })

        it('should pass a valid uuid', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                fileId: 'd9c7b8c3-ab8e-41d7-8c07-a52c33794e72'
            }

            const existing = entities['users'].dictionary['032563a3-1a0d-42f2-ad85-aef588b81ebe'] 

            const errors = await service.validateUser(user, existing, 'edit')

            expect(errors.length).toBe(0)

        })
    })

    describe('for status',  function() {
        it('Should return an error when status is not a string', async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                status: 10 
            }

            const existing = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a'] 

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:invalid-type')
        })

        it("Should return an error when status is not 'banned' or 'confirmed'", async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                status: 'unconfirmed' 
            }

            const existing = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a'] 

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:invalid')
        })

        it("Should return an error when existing.status is not 'banned', 'unconfirmed', or 'confirmed'", async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                status: 'confirmed' 
            }

            const existing = { ...entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a']  }
            existing.status = 'invited'

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(1)
            expect(errors[0].type).toBe('status:not-authorized')
        })

        it("Should pass a valid status", async function() {
            const service = new ValidationService(core)

            const user = {
                id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                status: 'banned' 
            }

            const existing = entities.users.dictionary['5c44ce06-1687-4709-b67e-de76c05acb6a'] 

            const errors = await service.validateUser(user, existing, 'admin-edit')

            expect(errors.length).toBe(0)
        })
    })
})
