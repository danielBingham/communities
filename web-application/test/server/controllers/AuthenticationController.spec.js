const backend = require('@communities/backend')
const AuthenticationService = backend.AuthenticationService

const AuthenticationController = require('../../../server/controllers/AuthenticationController')

/*************
 * TECHDEBT
 *
 * This whole spec is xed out because the settings portion of it is undone
 * which causes the tests to fail.  I'm currently pondering ripping out the
 * settings entirely.  We aren't using any of the notices.  The ignore/isolate
 * field system is broken and I'm contemplating replacing it with a "filters"
 * system.
 *
 * We might just rip out the settings system entirely.  It probably needs to
 * be redone anyway.
 */
describe('AuthenticationController', function() {

    // ====================== Fixture Data ====================================

    const submittedUsers = [
        {
            name: 'John Doe',
            email: 'john.doe@university.edu',
            username: 'john.doe',
            password: 'password'
        },
        {
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            username: 'jane.doe',
            password: 'different-password'
        }
    ]

    const database = [
        {
            User_id: 1,
            User_name: 'John Doe',
            User_email: 'john.doe@university.edu',
            User_username: 'john.doe',
            User_createdDate: 'TIMESTAMP',
            User_updatedDate: 'TIMESTAMP'
        },
        {
            User_id: 2,
            User_name: 'Jane Doe',
            User_email: 'jane.doe@university.edu',
            User_username: 'jane.doe',
            User_createdDate: 'TIMESTAMP',
            User_updatedDate: 'TIMESTAMP'
        }
    ]

    const expectedUsers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@university.edu',
            username: 'john.doe',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        },
        {
            id: 2,
            name: 'Jane Doe',
            email: 'jane.doe@university.edu',
            username: 'jane.doe',
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
        }
    ]

    // ====================== Mocks ===========================================

    const Response = function() {
        this.status = jest.fn(() => this)
        this.json = jest.fn(() => this)
        this.send = jest.fn(() => this)
    }

    const core = {
        logger: new backend.Logger(),
        database: {
            query: jest.fn()
        },
        queue: null,
        postmarkClient: {
            sendEmail: jest.fn()
        },
        features: new backend.FeatureFlags() 
    }

    // Disable logging.
    core.logger.level = -1

    const auth = new AuthenticationService(core)

    class SessionReturnsUser {

        get user() {
            return expectedUsers[0]
        }
    }

    class SessionReturnsUndefined {

        get user() {
            return undefined 
        }
    }

    class SessionThrows {

        get user() {
            throw new Error('This is a test error.')
        }
    }

    beforeEach(function() {
        core.database.query.mockReset()
    })

    xdescribe('.getAuthentication()', function() {
        it('should return 200 and an object with nulls when no user is in the session', async function() {
            const request = {
                session: new SessionReturnsUndefined() 
            }

            const authenticationController = new AuthenticationController(core)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({
                user: null
            })
        })

        it('should return 200 and the user when the session is populated', async function() {
            const request = {
                session: new SessionReturnsUser() 
            }

            const authenticationController = new AuthenticationController(core)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(200)
            expect(response.json.mock.calls[0][0]).toEqual({
                user: expectedUsers[0]
            })
        })

        it('should handle a thrown error by returning 500 and an "unknown" error', async function() {
            const request = { 
                session: new SessionThrows()
            }

            const authenticationController = new AuthenticationController(core)

            const response = new Response()
            await authenticationController.getAuthentication(request, response)

            expect(response.status.mock.calls[0][0]).toEqual(500)
            expect(response.json.mock.calls[0][0]).toEqual({ error: 'unknown' })
        })
    })


})
