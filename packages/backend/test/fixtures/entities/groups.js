/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/
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
    // ============ User One Memberships ======================================
    // User One 'member' membership in Test Open Group
    '138de5fc-a0a9-47eb-ac51-3c92f7780ad9': {
        id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        role: 'member',
        entranceAnswers: {},
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'moderator' membership in Test Open Group
    '7a42357c-9511-4c36-81db-97a492c7934c': {
        id: '7a42357c-9511-4c36-81db-97a492c7934c',
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'moderator',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'admin' membership in Test Open Group
    '684f7a9f-d415-48a3-be9b-2cd953da47f5': {
        id: '684f7a9f-d415-48a3-be9b-2cd953da47f5',
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'admin',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'member' membership in Test Private Group
    '0e1555d1-bccd-465d-85bc-4e3dbd4d29db': {
        id: '0e1555d1-bccd-465d-85bc-4e3dbd4d29db',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'moderator' membership in Test Private Group
    '30d5291a-8df7-4c82-9508-ffa78a00217b': {
        id: '30d5291a-8df7-4c82-9508-ffa78a00217b',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'moderator',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'admin' membership in Test Private Group
    'a1c5361e-3e46-435b-bab4-0a74ddbd79e2': {
        id: 'a1c5361e-3e46-435b-bab4-0a74ddbd79e2',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'admin',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'member' membership in Test Hidden Group
    'eee01f25-8669-4119-bcf6-4cd3eb3c4f26': {
        id: 'eee01f25-8669-4119-bcf6-4cd3eb3c4f26',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'moderator' membership in Test Hidden Group
    '664390e9-88d2-4114-8018-0b428dd47907': {
        id: '664390e9-88d2-4114-8018-0b428dd47907',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'moderator',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User One 'admin' membership in Test Hidden Group
    'e0eebdfd-b9b7-4f78-8035-cffe34f195f8': {
        id: 'e0eebdfd-b9b7-4f78-8035-cffe34f195f8',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'member',
        entranceAnswers: {},
        role: 'admin',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },

    // ============ User Two Memberships ======================================
    // User Two 'member' membership in Test Open Group
    'a9e18581-0826-491a-835a-751bcfc228a8': {
        id: 'a9e18581-0826-491a-835a-751bcfc228a8',
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        role: 'member',
        entranceAnswers: {},
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'moderator' membership in Test Open Group
    'bb88818d-6426-4e5a-b79a-688a700fef11': {
        id: 'bb88818d-6426-4e5a-b79a-688a700fef11',
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'moderator',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'admin' membership in Test Open Group
    'fef5f5a1-b500-4694-a5ca-c7ebea359295': {
        id: 'fef5f5a1-b500-4694-a5ca-c7ebea359295',
        groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'admin',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'member' membership in Test Private Group
    'bb64caa2-a6a6-43be-a11d-349b6e68f5a8': {
        id: 'bb64caa2-a6a6-43be-a11d-349b6e68f5a8',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'moderator' membership in Test Private Group
    '23d1cffa-856b-4f05-be4d-23913d59aa1d': {
        id: '30d5291a-8df7-4c82-9508-ffa78a00217b',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'moderator',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'admin' membership in Test Private Group
    '1a7be2fb-104d-4d9a-869e-5b91f829ebdc': {
        id: '1a7be2fb-104d-4d9a-869e-5b91f829ebdc',
        groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'admin',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'member' membership in Test Hidden Group
    'd0fa5e53-4306-4b0d-91cb-22df17a46104': {
        id: 'd0fa5e53-4306-4b0d-91cb-22df17a46104',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'member',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'moderator' membership in Test Hidden Group
    '1ac80a4a-1a5f-4f8c-a4a1-47ef52c54460': {
        id: '1ac80a4a-1a5f-4f8c-a4a1-47ef52c54460',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'moderator',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User Two 'admin' membership in Test Hidden Group
    '57558350-2c7f-4bf3-9d60-f4071e1782b0': {
        id: '57558350-2c7f-4bf3-9d60-f4071e1782b0',
        groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
        userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        status: 'member',
        entranceAnswers: {},
        role: 'admin',
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
    }
}

module.exports = {
    groups: groups,
    groupMembers: groupMembers
}
