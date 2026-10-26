/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media
 *  Copyright (C) 2022 - 2024 Daniel Bingham
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

// The backend's index loads modules jest can't (linkpeek is ESM-only), so
// stand in for it with just what the controller uses.
jest.mock('@communities/backend', () => ({
    AuthenticationService: class {
        hashPassword(password) {
            return `hashed:${password}`
        }
    },
    EncryptionService: class {
        async encrypt(message, aad, name, version) {
            return `encrypted(${message}, ${aad}, ${name}, ${version})`
        }
    },
    MultifactorAuthenticationService: class {
        constructor() {
            this.generateRecoveryCodes = jest.fn(async () => [ 'code-1', 'code-2' ])
        }
    },
    NotificationWorker: {
        notifications: [ 'Post:create:mention', 'UserRelationship:create:relation' ]
    },
    SessionService: class {
        constructor() {
            this.deleteSessionsForUser = jest.fn()
        }
    },
    UserDAO: class {
        constructor() {
            this.deleteUser = jest.fn()
            this.selectUsers = jest.fn(async (query) => ({
                dictionary: { [query.params[0]]: { id: query.params[0] } },
                list: [ query.params[0] ]
            }))
        }
    }
}))

jest.mock('otplib', () => ({
    generateSecret: () => 'TOTPSECRETBASE32'
}))

const Logger = require('@communities/backend/logger')

const TestController = require('../../../server/controllers/TestController')

const USER_ID = '6e9a9f2b-8c99-4a98-b50a-00e131ffd2ee'
const FLAGGER_ID = '0d4f1c62-1e3a-4f39-9a51-2b7e0c9d8a11'
const MODERATION_ID = '9b2c7e10-5d4a-4c1e-8f3b-6a0d2e9c4b77'

const SECRET = 'a-shared-secret-for-the-integration-tests'

describe('TestController', function() {

    let core = null
    let client = null

    beforeEach(function() {
        const logger = new Logger()
        logger.level = -1

        client = {
            query: jest.fn(async (sql) => {
                if ( sql.includes('INSERT INTO users') ) {
                    return { rows: [ { id: USER_ID } ] }
                }
                if ( sql.includes('INSERT INTO site_moderation') ) {
                    return { rows: [ { id: MODERATION_ID } ] }
                }
                return { rows: [] }
            }),
            release: jest.fn()
        }

        core = {
            config: {
                environment: 'development',
                session: { platformHeader: 'X-Communities-Platform' },
                test: { secret: SECRET }
            },
            logger: logger,
            database: {
                // Nothing conflicts and every flagger exists, unless a test
                // says otherwise.
                query: jest.fn(async (sql) => {
                    if ( sql.includes('WHERE id = $1') ) {
                        return { rows: [ { id: FLAGGER_ID } ] }
                    }
                    return { rows: [] }
                }),
                connect: jest.fn(async () => client)
            }
        }
    })

    const request = function(options) {
        const headers = {
            'x-communities-platform': 'test',
            'x-communities-test-secret': SECRET,
            ...(options.headers ?? {})
        }
        return {
            method: options.method ?? 'POST',
            originalUrl: options.url ?? '/api/0.0.0/test/user',
            body: options.body,
            params: options.params ?? {},
            get: (name) => headers[name.toLowerCase()]
        }
    }

    const response = function() {
        const response = {
            statusCode: null,
            body: undefined,
            status: jest.fn((code) => { response.statusCode = code; return response }),
            json: jest.fn((body) => { response.body = body; return response })
        }
        return response
    }

    const fixture = function(overrides) {
        return {
            name: 'Test User1',
            username: 'test-1a2b3c4d-user1',
            email: 'communities-test-1a2b3c4d-1@mailinator.com',
            password: 'a-random-password-for-this-run',
            ...overrides
        }
    }

    // The ControllerError a call rejects with.
    const rejection = async function(promise) {
        try {
            await promise
        } catch (error) {
            return error
        }
        throw new Error('Expected the call to reject.')
    }

    describe('environment', function() {
        it('Should be available in development and staging', function() {
            expect(TestController.isAvailableIn('development')).toBe(true)
            expect(TestController.isAvailableIn('staging')).toBe(true)
        })

        it('Should not be available in production, or anything else', function() {
            expect(TestController.isAvailableIn('production')).toBe(false)
            expect(TestController.isAvailableIn(undefined)).toBe(false)
            expect(TestController.isAvailableIn('')).toBe(false)
        })

        it('Should refuse to be constructed for production', function() {
            core.config.environment = 'production'
            expect(() => new TestController(core)).toThrow(/never 'production'/)
        })
    })

    describe('the configured secret', function() {
        it('Should refuse to be constructed without one', function() {
            delete core.config.test
            expect(() => new TestController(core)).toThrow(/test\.secret/)
        })

        it('Should refuse to be constructed with a short one', function() {
            core.config.test.secret = 'too-short'
            expect(() => new TestController(core)).toThrow(/at least 32/)
        })

        it.each([
            [ 'missing', { 'x-communities-test-secret': undefined } ],
            [ 'wrong', { 'x-communities-test-secret': 'b-shared-secret-for-the-integration-tests' } ],
            [ 'a prefix of it', { 'x-communities-test-secret': SECRET.substring(0, 10) } ],
            [ 'empty', { 'x-communities-test-secret': '' } ]
        ])('Should refuse POST and DELETE when the secret header is %s', async function(label, headers) {
            const controller = new TestController(core)

            const posted = await rejection(controller.postUser(request({ headers: headers, body: fixture() }), response()))
            expect(posted.status).toBe(403)
            expect(posted.type).toBe('not-authorized')

            const deleted = await rejection(controller.deleteUser(request({
                method: 'DELETE', headers: headers, params: { id: USER_ID }
            }), response()))
            expect(deleted.status).toBe(403)

            expect(core.database.query).not.toHaveBeenCalled()
            expect(core.database.connect).not.toHaveBeenCalled()
        })
    })

    describe('the platform header', function() {
        it.each([
            [ 'missing', { 'x-communities-platform': undefined } ],
            [ 'web', { 'x-communities-platform': 'web' } ],
            [ 'ios', { 'x-communities-platform': 'ios' } ],
            [ 'TEST', { 'x-communities-platform': 'TEST' } ]
        ])('Should refuse POST and DELETE when it is %s', async function(label, headers) {
            const controller = new TestController(core)

            const posted = await rejection(controller.postUser(request({ headers: headers, body: fixture() }), response()))
            expect(posted.status).toBe(403)
            expect(posted.type).toBe('not-authorized')

            const deleted = await rejection(controller.deleteUser(request({
                method: 'DELETE', headers: headers, params: { id: USER_ID }
            }), response()))
            expect(deleted.status).toBe(403)

            expect(core.database.query).not.toHaveBeenCalled()
            expect(core.database.connect).not.toHaveBeenCalled()
        })
    })

    describe('POST /test/user', function() {
        it('Should create a confirmed user with the defaults', async function() {
            const controller = new TestController(core)
            const res = response()

            await controller.postUser(request({ body: fixture() }), res)

            expect(res.statusCode).toBe(201)
            expect(res.body.entity.id).toBe(USER_ID)

            const insert = client.query.mock.calls.find(([ sql ]) => sql.includes('INSERT INTO users'))
            const [ email, name, username, password, status, siteRole, settings, multifactor ] = insert[1]
            expect(email).toBe('communities-test-1a2b3c4d-1@mailinator.com')
            expect(name).toBe('Test User1')
            expect(username).toBe('test-1a2b3c4d-user1')
            expect(password).toBe('hashed:a-random-password-for-this-run')
            expect(status).toBe('confirmed')
            expect(siteRole).toBe('user')
            expect(multifactor).toBe('disabled')
            expect(settings).toEqual({
                notifications: {
                    'Post:create:mention': { web: true, email: false, desktop: false, mobile: false },
                    'UserRelationship:create:relation': { web: true, email: false, desktop: false, mobile: false }
                },
                showInfo: false,
                showAnnouncements: false
            })

            const statements = client.query.mock.calls.map(([ sql ]) => sql.trim().split(/\s+/)[0])
            expect(statements).toEqual([ 'BEGIN', 'INSERT', 'COMMIT' ])
            expect(client.release).toHaveBeenCalled()

            // No multi-factor authentication, so nothing to hand back.
            expect(res.body.multifactorSecret).toBeUndefined()
            expect(res.body.recoveryCodes).toBeUndefined()
            expect(controller.multifactorAuthenticationService.generateRecoveryCodes).not.toHaveBeenCalled()
        })

        it('Should enroll a multi-factor fixture and hand back its secret and recovery codes', async function() {
            const controller = new TestController(core)
            const res = response()

            await controller.postUser(request({ body: fixture({ multifactor: 'enabled' }) }), res)

            expect(res.statusCode).toBe(201)
            expect(res.body.multifactorSecret).toBe('TOTPSECRETBASE32')
            expect(res.body.recoveryCodes).toEqual([ 'code-1', 'code-2' ])

            // The secret is encrypted for the user and stored in the same
            // transaction as the user.
            const secret = client.query.mock.calls.find(([ sql ]) => sql.includes('authentication__multifactor_secret'))
            expect(secret[1]).toEqual([ `encrypted(TOTPSECRETBASE32, ${USER_ID}, mfa, v1)`, USER_ID ])
            const statements = client.query.mock.calls.map(([ sql ]) => sql.trim().split(/\s+/)[0])
            expect(statements).toEqual([ 'BEGIN', 'INSERT', 'UPDATE', 'COMMIT' ])

            const insert = client.query.mock.calls.find(([ sql ]) => sql.includes('INSERT INTO users'))
            expect(insert[1][7]).toBe('enabled')

            expect(controller.multifactorAuthenticationService.generateRecoveryCodes).toHaveBeenCalledWith(USER_ID)
        })

        it('Should delete a multi-factor fixture whose recovery codes fail', async function() {
            const controller = new TestController(core)
            controller.multifactorAuthenticationService.generateRecoveryCodes = jest.fn(async () => {
                throw new Error('recovery codes failed')
            })
            const res = response()

            const error = await rejection(controller.postUser(request({ body: fixture({ multifactor: 'enabled' }) }), res))

            expect(error.message).toBe('recovery codes failed')
            expect(controller.userDAO.deleteUser).toHaveBeenCalledWith({ id: USER_ID })
            expect(res.status).not.toHaveBeenCalled()
        })

        it('Should create the special fixtures', async function() {
            const controller = new TestController(core)

            await controller.postUser(request({
                body: fixture({ status: 'banned', siteRole: 'admin' })
            }), response())

            const insert = client.query.mock.calls.find(([ sql ]) => sql.includes('INSERT INTO users'))
            expect(insert[1][4]).toBe('banned')
            expect(insert[1][5]).toBe('admin')
        })

        it('Should create an invited user without a password', async function() {
            const controller = new TestController(core)

            await controller.postUser(request({
                body: fixture({ status: 'invited', password: undefined })
            }), response())

            const insert = client.query.mock.calls.find(([ sql ]) => sql.includes('INSERT INTO users'))
            expect(insert[1][3]).toBe(null)
            expect(insert[1][4]).toBe('invited')
        })

        it('Should create the moderation of the profile with the user', async function() {
            const controller = new TestController(core)

            await controller.postUser(request({
                body: fixture({ siteModeration: { status: 'rejected', flaggedBy: FLAGGER_ID } })
            }), response())

            const moderation = client.query.mock.calls.find(([ sql ]) => sql.includes('INSERT INTO site_moderation'))
            expect(moderation[1]).toEqual([ FLAGGER_ID, 'rejected', USER_ID ])

            const link = client.query.mock.calls.find(([ sql ]) => sql.includes('UPDATE users SET site_moderation_id'))
            expect(link[1]).toEqual([ MODERATION_ID, USER_ID ])

            const statements = client.query.mock.calls.map(([ sql ]) => sql.trim().split(/\s+/)[0])
            expect(statements).toEqual([ 'BEGIN', 'INSERT', 'INSERT', 'UPDATE', 'COMMIT' ])
        })

        it.each([
            [ 'a missing name', { name: undefined } ],
            [ 'an invalid username', { username: '1-starts-with-a-number' } ],
            [ 'an upper case username', { username: 'Test-User' } ],
            [ 'an email that is not a fixture email', { email: 'someone@example.com' } ],
            [ 'an unknown status', { status: 'deleted' } ],
            [ 'the superadmin site role', { siteRole: 'superadmin' } ],
            [ 'a pending multi-factor state', { multifactor: 'pending' } ],
            [ 'a short password', { password: 'short' } ],
            [ 'a missing password', { password: undefined } ],
            [ 'an invited user with a password', { status: 'invited' } ],
            [ 'an unknown moderation status', { siteModeration: { status: 'deleted', flaggedBy: FLAGGER_ID } } ],
            [ 'a flaggedBy that is not an id', { siteModeration: { status: 'flagged', flaggedBy: 'user1' } } ]
        ])('Should refuse %s', async function(label, overrides) {
            const controller = new TestController(core)

            const error = await rejection(controller.postUser(request({ body: fixture(overrides) }), response()))

            expect(error.status).toBe(400)
            expect(error.type).toBe('invalid')
            expect(core.database.connect).not.toHaveBeenCalled()
        })

        it('Should refuse a body that is not a single object', async function() {
            const controller = new TestController(core)

            const error = await rejection(controller.postUser(request({ body: [ fixture() ] }), response()))

            expect(error.status).toBe(400)
        })

        it('Should refuse a moderation flagged by a user who does not exist', async function() {
            core.database.query = jest.fn(async () => ({ rows: [] }))
            const controller = new TestController(core)

            const error = await rejection(controller.postUser(request({
                body: fixture({ siteModeration: { status: 'flagged', flaggedBy: FLAGGER_ID } })
            }), response()))

            expect(error.status).toBe(400)
            expect(core.database.connect).not.toHaveBeenCalled()
        })

        it('Should answer 409 when the email or username is taken', async function() {
            core.database.query = jest.fn(async () => ({ rows: [ { id: USER_ID } ] }))
            const controller = new TestController(core)

            const error = await rejection(controller.postUser(request({ body: fixture() }), response()))

            expect(error.status).toBe(409)
            expect(core.database.connect).not.toHaveBeenCalled()
        })

        it('Should roll back when an insert fails', async function() {
            client.query = jest.fn(async (sql) => {
                if ( sql.includes('INSERT INTO site_moderation') ) {
                    throw new Error('insert failed')
                }
                return { rows: [ { id: USER_ID } ] }
            })
            const controller = new TestController(core)

            const error = await rejection(controller.postUser(request({
                body: fixture({ siteModeration: { status: 'flagged', flaggedBy: FLAGGER_ID } })
            }), response()))

            expect(error.message).toBe('insert failed')
            const statements = client.query.mock.calls.map(([ sql ]) => sql.trim().split(/\s+/)[0])
            expect(statements).toEqual([ 'BEGIN', 'INSERT', 'INSERT', 'ROLLBACK' ])
            expect(client.release).toHaveBeenCalled()
        })
    })

    describe('DELETE /test/user/:id', function() {
        const deleteRequest = (id) => request({ method: 'DELETE', url: `/api/0.0.0/test/user/${id}`, params: { id: id } })

        it('Should delete a fixture and its sessions', async function() {
            core.database.query = jest.fn(async () => ({ rows: [ { email: 'communities-test-1a2b3c4d-1@mailinator.com' } ] }))
            const controller = new TestController(core)
            const res = response()

            await controller.deleteUser(deleteRequest(USER_ID), res)

            expect(res.statusCode).toBe(200)
            expect(controller.sessionService.deleteSessionsForUser).toHaveBeenCalledWith(USER_ID)
            expect(controller.userDAO.deleteUser).toHaveBeenCalledWith({ id: USER_ID })
        })

        it('Should refuse to delete a user who is not a fixture', async function() {
            core.database.query = jest.fn(async () => ({ rows: [ { email: 'someone@example.com' } ] }))
            const controller = new TestController(core)

            const error = await rejection(controller.deleteUser(deleteRequest(USER_ID), response()))

            expect(error.status).toBe(403)
            expect(controller.userDAO.deleteUser).not.toHaveBeenCalled()
            expect(controller.sessionService.deleteSessionsForUser).not.toHaveBeenCalled()
        })

        it('Should answer 404 for a user who does not exist', async function() {
            core.database.query = jest.fn(async () => ({ rows: [] }))
            const controller = new TestController(core)

            const error = await rejection(controller.deleteUser(deleteRequest(USER_ID), response()))

            expect(error.status).toBe(404)
            expect(controller.userDAO.deleteUser).not.toHaveBeenCalled()
        })

        it('Should answer 400 for something that is not a user id', async function() {
            const controller = new TestController(core)

            const error = await rejection(controller.deleteUser(deleteRequest('user1'), response()))

            expect(error.status).toBe(400)
            expect(core.database.query).not.toHaveBeenCalled()
        })
    })
})
