const groups = {
    'aeb26ec5-3644-4b7a-805e-375551ec65b6': {
        rows: [
            {
                Group_id: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                Group_type: 'open',
                Group_title: 'Test Open Group',
                Group_slug: 'test-open-group',
                Group_about: 'This is a test open group.',
                Group_fileId: null,
                Group_entranceQuestions: {},
                Group_createdDate: 'TIMESTAMP',
                Group_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    '8661a1ef-6259-4d5a-a59f-4d75929a765f': {
        rows: [
            {
                Group_id: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                Group_type: 'private',
                Group_title: 'Test Private Group',
                Group_slug: 'test-private-group',
                Group_about: 'This is a test private group.',
                Group_fileId: null,
                Group_entranceQuestions: {},
                Group_createdDate: 'TIMESTAMP',
                Group_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    '4e66c241-ef21-4143-b7b4-c4fe81a34acd': {
        rows: [
            {
                Group_id: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                Group_type: 'hidden',
                Group_title: 'Test Hidden Group',
                Group_slug: 'test-hidden-group',
                Group_about: 'This is a test hidden group.',
                Group_fileId: null,
                Group_entranceQuestions: {},
                Group_createdDate: 'TIMESTAMP',
                Group_updatedDate: 'TIMESTAMP'
            }
        ]
    }
}

const groupMembers = {
    // User One 'member' membership in Test Open Group
    '138de5fc-a0a9-47eb-ac51-3c92f7780ad9': {
        rows: [
            {
                GroupMember_id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
                GroupMember_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'admin' membership in Test Open Group
    '7a42357c-9511-4c36-81db-97a492c7934c': {
        rows: [
            {
                GroupMember_id: '7a42357c-9511-4c36-81db-97a492c7934c',
                GroupMember_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'moderator',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'admin' membership in Test Open Group
    '684f7a9f-d415-48a3-be9b-2cd953da47f5': {
        rows: [
            {
                GroupMember_id: '684f7a9f-d415-48a3-be9b-2cd953da47f5',
                GroupMember_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'admin',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'member' membership in Test Private Group
    '0e1555d1-bccd-465d-85bc-4e3dbd4d29db': {
        rows: [
            {
                GroupMember_id: '0e1555d1-bccd-465d-85bc-4e3dbd4d29db',
                GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'moderator' membership in Test Private Group
    '30d5291a-8df7-4c82-9508-ffa78a00217b': {
        rows: [
            {
                GroupMember_id: '30d5291a-8df7-4c82-9508-ffa78a00217b',
                GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'moderator',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'admin' membership in Test Private Group
    'a1c5361e-3e46-435b-bab4-0a74ddbd79e2': {
        rows: [
            {
                GroupMember_id: 'a1c5361e-3e46-435b-bab4-0a74ddbd79e2',
                GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'admin',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'member' membership in Test Hidden Group
    'eee01f25-8669-4119-bcf6-4cd3eb3c4f26': {
        rows: [
            {
                GroupMember_id: 'eee01f25-8669-4119-bcf6-4cd3eb3c4f26',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'moderator' membership in Test Hidden Group
    '664390e9-88d2-4114-8018-0b428dd47907': {
        rows: [
            {
                GroupMember_id: '664390e9-88d2-4114-8018-0b428dd47907',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'moderator',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User One 'admin' membership in Test Hidden Group
    'e0eebdfd-b9b7-4f78-8035-cffe34f195f8': {
        rows: [
            {
                GroupMember_id: 'e0eebdfd-b9b7-4f78-8035-cffe34f195f8',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'admin',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two membership in Test Private Group
    '70f2c9ee-e614-4bb0-bed0-83b42d1b37cd': {
        rows: [
            {
                GroupMember_id: '70f2c9ee-e614-4bb0-bed0-83b42d1b37cd',
                GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // Admin user membership in Test Private Group
    '34215650-8088-46b1-9841-2bda331ead1b': {
        rows: [
            {
                GroupMember_id: '34215650-8088-46b1-9841-2bda331ead1b',
                GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // Admin user member of Test Hidden Group 
    '839181b1-3124-4649-908d-2375ad0441a3': {
        rows: [
            {
                GroupMember_id: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two member of Test Hidden Group 
    '79104b92-46c7-4e01-88f0-b9f261ecaf78': {
        rows: [
            {
                GroupMember_id: '79104b92-46c7-4e01-88f0-b9f261ecaf78',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    }
}

module.exports = {
    groups: groups,
    groupMembers: groupMembers
}
