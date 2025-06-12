const groups = {
    // type: open
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
    // type: private
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
    // type: hidden
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
    // ============ User One Memberships ======================================
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
    // User One 'moderator' membership in Test Open Group
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

    // ============ User Two Memberships ======================================
    // User Two 'member' membership in Test Open Group
    'a9e18581-0826-491a-835a-751bcfc228a8': {
        rows: [
            {
                GroupMember_id: 'a9e18581-0826-491a-835a-751bcfc228a8',
                GroupMember_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_role: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two 'moderator' membership in Test Open Group
    'bb88818d-6426-4e5a-b79a-688a700fef11': {
        rows: [
            {
                GroupMember_id: 'bb88818d-6426-4e5a-b79a-688a700fef11',
                GroupMember_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'moderator',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two 'admin' membership in Test Open Group
    'fef5f5a1-b500-4694-a5ca-c7ebea359295': {
        rows: [
            {
                GroupMember_id: 'fef5f5a1-b500-4694-a5ca-c7ebea359295',
                GroupMember_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'admin',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'

            }
        ]
    },
    // User Two 'member' membership in Test Private Group
    'bb64caa2-a6a6-43be-a11d-349b6e68f5a8': {
        rows: [
            {
                GroupMember_id: 'bb64caa2-a6a6-43be-a11d-349b6e68f5a8',
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
    // User Two 'moderator' membership in Test Private Group
    '23d1cffa-856b-4f05-be4d-23913d59aa1d': {
        rows: [
            {
                GroupMember_id: '23d1cffa-856b-4f05-be4d-23913d59aa1d',
                GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'moderator',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two 'admin' membership in Test Private Group
    '1a7be2fb-104d-4d9a-869e-5b91f829ebdc': {
        rows: [
            {
                GroupMember_id: '1a7be2fb-104d-4d9a-869e-5b91f829ebdc',
                GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'admin',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two 'member' membership in Test Hidden Group
    'd0fa5e53-4306-4b0d-91cb-22df17a46104': {
        rows: [
            {
                GroupMember_id: 'd0fa5e53-4306-4b0d-91cb-22df17a46104',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'member',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two 'moderator' membership in Test Hidden Group
    '1ac80a4a-1a5f-4f8c-a4a1-47ef52c54460': {
        rows: [
            {
                GroupMember_id: '1ac80a4a-1a5f-4f8c-a4a1-47ef52c54460',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'moderator',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User Two 'admin' membership in Test Hidden Group
    '57558350-2c7f-4bf3-9d60-f4071e1782b0': {
        rows: [
            {
                GroupMember_id: '57558350-2c7f-4bf3-9d60-f4071e1782b0',
                GroupMember_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd',
                GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                GroupMember_status: 'member',
                GroupMember_entranceAnswers: {},
                GroupMember_role: 'admin',
                GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_updatedDate: 'TIMESTAMP'
            }
        ]
    },

    // Admin user membership in Test Private Group
    '34215650-8088-46b1-9841-2bda331ead1b': {
        GroupMember_rows: [
            {
                GroupMember_GroupMember_id: '34215650-8088-46b1-9841-2bda331ead1b',
                GroupMember_GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
                GroupMember_GroupMember_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                GroupMember_GroupMember_status: 'member',
                GroupMember_GroupMember_entranceAnswers: {},
                GroupMember_GroupMember_role: 'member',
                GroupMember_GroupMember_createdDate: 'TIMESTAMP',
                GroupMember_GroupMember_updatedDate: 'TIMESTAMP'
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
    }
}

module.exports = {
    groups: groups,
    groupMembers: groupMembers
}
