/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/
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

module.exports = {
    posts: posts
}
