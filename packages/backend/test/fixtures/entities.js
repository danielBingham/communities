/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/

/**
 * User Entities
 *
 * These are users that have all of their data, including private data.
 *
 * @see packages/backend/daos/UserDAO.js -> hydrateUsers()
 */
const users = {
    '5c44ce06-1687-4709-b67e-de76c05acb6a': {
        id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        fileId: null,
        name: 'User One',
        username: 'User One',
        email: 'user.one@mailinator.com',
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
        name: 'User Two',
        username: 'user-two',
        email: 'user-two@mailinator.com',
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
    'cd33814b-2381-4b55-b108-3395b8866792': {
        id: 'cd33814b-2381-4b55-b108-3395b8866792',
        fileId: 'f6cf86ab-98e5-4246-9310-41bc7c6c559a',
        name: 'User Three',
        username: 'user-three.4',
        email: 'user-three.4@mailinator.com',
        status: 'confirmed',
        permissions: 'user',
        settings: {
            notifications: {
                'Post:comment:create': {
                    email: false,
                    push: true,
                    web: true
                },
                'User:friend:update': {
                    email: false,
                    push: true,
                    web: true
                }
            }
        },
        notices: {},
        about: 'This is a test bio.',
        location: '',
        invitations: 45,
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

const userRelationships = {
    // Confirmed Relationship between Admin User and User One
    '8fc429cc-aec4-4cc8-8394-f2aa3f7c125c': {
        id: '8fc429cc-aec4-4cc8-8394-f2aa3f7c125c',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        relationId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'confirmed',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // Confirmed Relationship between User Two and Admin User
    '7dac4233-3605-4abd-8528-21f15c4e4126': {
        id: '7dac4233-3605-4abd-8528-21f15c4e4126',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        relationId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        status: 'confirmed',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // Confirmed Relationship between User Two and User One 
    '5c03d0d2-da31-44c2-9a50-1ae524c23c1d': {
        id: '5c03d0d2-da31-44c2-9a50-1ae524c23c1d',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        relationId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'confirmed',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // Pending Relationship between User Three and Admin User
    '42c63d92-dfbb-44a3-b5ba-eb6374f73c72': {
        id: '42c63d92-dfbb-44a3-b5ba-eb6374f73c72',
        userId: 'cd33814b-2381-4b55-b108-3395b8866792',
        relationId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        status: 'pending',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
}

const posts = {
    // Private post to a feed by Admin User
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
        content: 'This is a test private post to a feed by Admin User.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    // Private post to a feed by User One 
    '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e': {
        id: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e',
        type: 'feed',
        visibility: 'private',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        fileId: null,
        groupId: null,
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test private post to a feed by User One.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    // Private post to a feed by User Two  
    '1457275b-5230-473a-8558-ffce376d77ac': {
        id: '1457275b-5230-473a-8558-ffce376d77ac',
        type: 'feed',
        visibility: 'private',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        fileId: null,
        groupId: null,
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test private post to a feed by User Two.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    // Public post to a feed by Admin User
    'e792718e-6730-438e-85f7-a5172af3d740': {
        id: '703955d2-77df-4635-8ab8-b9108fef217f',
        type: 'feed',
        visibility: 'public',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: null,
        groupId: null,
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test private post to a feed.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    // Private post to Test Private Group group by Admin User
    '63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d': {
        id: '63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d',
        type: 'group',
        visibility: 'private',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: null,
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f', // private group
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test private post to a private group.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    // Public post to an Test Open Group by Admin User 
    '01f39e3e-e1f4-4ae2-bced-dcb9619ea3de': {
        id: '01f39e3e-e1f4-4ae2-bced-dcb9619ea3de',
        type: 'group',
        visibility: 'public',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: null,
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6', // Open group
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test public post to an open group.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    // Private post to Test Hidden Group by Admin User 
    '832d3206-d6f3-4ed4-9028-8ef2045485a3': {
        id: '832d3206-d6f3-4ed4-9028-8ef2045485a3',
        type: 'group',
        visibility: 'private',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: null,
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd', // Open group
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test private post to a hidden group.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
    // Private post to Test Private Group group by User Two 
    'e9f73a4a-bdaa-4633-9a8e-bea636f651a1': {
        id: 'e9f73a4a-bdaa-4633-9a8e-bea636f651a1',
        type: 'group',
        visibility: 'private',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        fileId: null,
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f', // private group
        linkPreviewId: null,
        sharedPostId: null,
        activity: 1,
        content: 'This is a test private post to a private group.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        postReactions: [],
        postComments: []
    },
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

const groupMembers = {
    // User One membership in Test Open Group
    '138de5fc-a0a9-47eb-ac51-3c92f7780ad9': {
        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two membership in Test Private Group
    '70f2c9ee-e614-4bb0-bed0-83b42d1b37cd': {
        id: '70f2c9ee-e614-4bb0-bed0-83b42d1b37cd',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // Admin user membership in Test Private Group
    '34215650-8088-46b1-9841-2bda331ead1b': {
        id: '34215650-8088-46b1-9841-2bda331ead1b',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // Admin user member of Test Hidden Group 
    '839181b1-3124-4649-908d-2375ad0441a3': {
        id: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two member of Test Hidden Group 
    '79104b92-46c7-4e01-88f0-b9f261ecaf78': {
        id: '79104b92-46c7-4e01-88f0-b9f261ecaf78',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
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
    userRelationships: {
        dictionary: userRelationships,
        list: Object.values(userRelationships),
        meta: {
            count: Object.keys(userRelationships).length,
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
    },
    groupMembers: {
        dictionary: groupMembers,
        list: Object.values(groupMembers),
        meta: {
            count: Object.keys(groupMembers).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    }
}
