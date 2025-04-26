/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/

/**
 * Unclean User Entities
 *
 * These are users that have all of their data, including private data.
 *
 * @see packages/backend/daos/UserDAO.js -> hydrateUsers()
 */
const users = {
    '5c44ce06-1687-4709-b67e-de76c05acb6a': {
        id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        fileId: null,
        name: 'Valid User',
        username: 'valid.user',
        email: 'valid.user@mailinator.com',
        status: 'confirmed',
        permissions: 'user',
        settings: {},
        notices: {},
        about: '',
        location: '',
        invitations: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    '2a7ae011-689c-4aa2-8f13-a53026d40964': {
        id: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        fileId: 'f6cf86ab-98e5-4246-9310-41bc7c6c559a',
        name: 'Another User',
        username: 'another-user',
        email: 'another-user@mailinator.com',
        status: 'confirmed',
        permissions: 'user',
        settings: {
            notifications: {
                'Post:comment:create': {
                    email: true,
                    push: true,
                    web: true
                },
                'Post:comment:create:subscriber': {
                    email: true,
                    push: true,
                    web: true
                },
                'User:friend:create': {
                    email: true,
                    push: true,
                    web: true
                },
                'User:friend:update': {
                    email: true,
                    push: true,
                    web: true
                }
            }
        },
        notices: {},
        about: '',
        location: '',
        invitations: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    '469931f6-26f2-4e1c-b4a0-849aed14e977': {
        id: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: '9fcb6b9a-55a0-44e4-9f88-50fd22874325',
        name: 'Admin User',
        username: 'admin.user-test',
        email: 'admin-user@mailinator.com',
        status: 'confirmed',
        permissions: 'admin',
        settings: {
            notifications: {}
        },
        notices: {},
        about: 'An admin with a bio.',
        location: '',
        invitations: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    '032563a3-1a0d-42f2-ad85-aef588b81ebe': {
        id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
        fileId: null,
        name: '',
        username: '',
        email: 'test@test.com',
        status: 'invited',
        permissions: 'user',
        settings: {},
        notices: {},
        about: null,
        location: '',
        invitations: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }
}

/**
 * Export the entities in the form of the `results` objects returned by our 
 * GET /resources endpoints.
 */
module.exports = {
    users: {
        dictionary: users,
        list: Object.values(users),
        meta: {
            count: Object.keys(users).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    }
}
