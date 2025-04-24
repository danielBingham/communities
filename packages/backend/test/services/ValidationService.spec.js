const Logger = require('../../logger')
const FeatureFlags = require('../../features')

const ServiceError = require('../../errors/ServiceError')
const ValidationService = require('../../services/ValidationService')

describe('ValidationService', function() {

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

    describe('validateUser()', function() {

        it('Should return errors when the user attempts to set invalid fields', async function() {
            const service = new ValidationService(core)

            const user = {
                id: 'test',
                status: 'test',
            }

            const errors = await service.validateUser(user, null, null)  

            expect(errors.length).toBe(2)
        })
        
        it('Should return one error for each invalid field set', async function() {
            const service = new ValidationService(core)

            const user = {
                id: 'test',
                status: 'test',
                permissions: 'test',
                updatedDate: 'test'
            }

            const errors = await service.validateUser(user, null, null)

            expect(errors.length).toBe(4)
        })

        it('Should treat an invalid field set to `null` as set', async function() {
            const service = new ValidationService(core)

            const user = {
                status: null
            }

            const errors = await service.validateUser(user, null, null)

            expect(errors.length).toBe(1)
        })

        it('Should not let you set email, name, username, or password to `null`', async function() {
            const service = new ValidationService(core)

            const user = {
                email: null,
                name: null,
                username: null,
                password: null
            }

            const errors = await service.validateUser(user, null, null)

            expect(errors.length).toBe(4)
        })

        xit('Should throw a ServiceError when the authentication fails', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu', password: 'PasswordPassword' }
            const hash = auth.hashPassword('passwordpassword')

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: hash } ]})


            try {
                const userId = await auth.authenticateUser(credentials) 
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('authentication-failed')
            }

            expect.hasAssertions()
        })

        xit('Should throw a ServiceError when no user is found', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu', password: 'PasswordPassword' }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 0, rows: [  ]})


            try {
                const userId = await auth.authenticateUser(credentials) 
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('no-user')
            }

            expect.hasAssertions()
        })

        xit('Should throw a ServiceError when no password is included in credentials', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu' }
            const hash = auth.hashPassword('PasswordPassword')

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: hash } ]})

            try {
                const userId = await auth.authenticateUser(credentials) 
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('no-credential-password')
            }

            expect.hasAssertions()
        })

        xit('Should throw a ServiceError when the database user is missing a password', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu', password: 'PasswordPassword' }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: null } ]})

            try {
                const userId = await auth.authenticateUser(credentials) 
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('no-user-password')
            }

            expect.hasAssertions()
        })
    })
})
