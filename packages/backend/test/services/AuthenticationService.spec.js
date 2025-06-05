const Logger = require('../../logger')
const FeatureFlags = require('../../features')

const ServiceError = require('../../errors/ServiceError')
const AuthenticationService = require('../../services/AuthenticationService')

describe('AuthenticationService', function() {

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

    // Disable logging.
    core.logger.level = -1

    beforeEach(function() {
        core.database.query.mockReset()
        core.logger.level = -1 
    })

    describe('checkPassword()', function() {
        
        it('Should succeed when checking a hashed password', function() {
            const auth = new AuthenticationService(core)

            const hash = auth.hashPassword('PasswordPassword')

            const check = auth.checkPassword('PasswordPassword', hash)

            expect(check).toBe(true)
        })

        it('Should fail when checking the wrong password against a hash', function() {
            const auth = new AuthenticationService(core)

            const hash = auth.hashPassword('PasswordPassword')

            const check = auth.checkPassword('passwordpassword', hash)

            expect(check).toBe(false)
        })
    })

    describe('authenticateUser()', function() {

        it('Should return the correct userId when authentication is successful', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu', password: 'PasswordPassword' }
            const hash = auth.hashPassword(credentials.password)

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: hash, status: 'confirmed' } ]})

            const userId = await auth.authenticateUser(credentials)

            expect(userId).toBe(1)
        })

        it('Should throw a ServiceError when the authentication fails', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu', password: 'PasswordPassword' }
            const hash = auth.hashPassword('passwordpassword')

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: hash, status: 'confirmed' } ]})


            try {
                const userId = await auth.authenticateUser(credentials) 
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('authentication-failed')
            }

            expect.hasAssertions()
        })

        it('Should throw a ServiceError when the user has been banned', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu', password: 'PasswordPassword' }
            const hash = auth.hashPassword('PasswordPassword')

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: hash, status: 'banned' } ]})


            try {
                const userId = await auth.authenticateUser(credentials) 
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('banned')
            }

            expect.hasAssertions()
        })

        it('Should throw a ServiceError when no user is found', async function() {
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

        it('Should throw a ServiceError when no password is included in credentials', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu' }
            const hash = auth.hashPassword('PasswordPassword')

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: hash, status: 'confirmed' } ]})

            try {
                const userId = await auth.authenticateUser(credentials) 
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('no-credential-password')
            }

            expect.hasAssertions()
        })

        it('Should throw a ServiceError when the database user is missing a password', async function() {
            const auth = new AuthenticationService(core)

            const credentials = { email: 'jwatson@university.edu', password: 'PasswordPassword' }

            core.database.query.mockReturnValue(undefined)
                .mockReturnValueOnce({ rowCount: 1, rows: [ { id: 1, password: null, status: 'invited' } ]})

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
