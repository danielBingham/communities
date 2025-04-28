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

const posts = {
    '703955d2-77df-4635-8ab8-b9108fef217f': {
        id: '703955d2-77df-4635-8ab8-b9108fef217f',
        type: 'feed',
        visibility: 'private',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: null,
        groupId: null,
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test post.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    '63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d': {
        id: '63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d',
        type: 'group',
        visibility: 'private',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: null,
        groupId: '6a9f554b-1ff8-483a-9137-008e412a877e',
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test group post.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    }
}

const groups = {
    'aeb26ec5-3644-4b7a-805e-375551ec65b6': {
        id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        type: 'open',
        title: 'Test Open Group',
        slug: 'test-open-group',
        about: 'This is a test open group.',
        fileId: null,
        entranceQuestions: {},
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    '8661a1ef-6259-4d5a-a59f-4d75929a765f': {
        id: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        type: 'private',
        title: 'Test Private Group',
        slug: 'test-private-group',
        about: 'This is a test private group.',
        fileId: null,
        entranceQuestions: {},
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    '4e66c241-ef21-4143-b7b4-c4fe81a34acd': {
        id: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        type: 'hidden',
        title: 'Test Hidden Group',
        slug: 'test-hidden-group',
        about: 'This is a test hidden group.',
        fileId: null,
        entranceQuestions: {},
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
    },
    posts: {
        dictionary: posts,
        list: Object.values(posts),
        meta: {
            count: Object.keys(posts).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    groups: {
        dictionary: groups,
        list: Object.values(groups),
        meta: {
            count: Object.keys(groups).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    }
}
