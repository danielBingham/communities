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
    // User One 'member' membership in Test Open Group
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
    // User One 'admin' membership in Test Open Group
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

module.exports = {
    groups: groups,
    groupMembers: groupMembers
}
