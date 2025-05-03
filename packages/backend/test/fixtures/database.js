/******************************************************************************
 * Database fixtures.
 *
 * These are mock database row results.  They can be returned from  mock of
 * `database.query` in the DAO to test the DAO's hydration methods, or to mock
 * the DAO's `selectResource` method.
 *
 ******************************************************************************/

const users = [
    {
        User_id: 1,
        User_fileId: null,
        User_name: 'James Watson',
        User_username: 'james.watson',
        User_email: 'jwatson@university.edu',
        User_status: 'confirmed',
        User_permissions: 'user',
        User_settings: {},
        User_notices: {},
        User_about: '',
        User_location: '',
        User_invitations: 50,
        User_createdDate: 'TIMESTAMP',
        User_updatedDate: 'TIMESTAMP'
    },
    {
        User_id: 2,
        User_fileId: null,
        User_name: 'Francis Crick',
        User_username: 'francis.crick',
        User_email: 'fcrick@university.edu',
        User_status: 'confirmed',
        User_permissions: 'user',
        User_settings: {},
        User_notices: {},
        User_about: '',
        User_location: '',
        User_invitations: 50,
        User_createdDate: 'TIMESTAMP',
        User_updatedDate: 'TIMESTAMP'
    }
]

const user_relationships = [
    // Relationship between User One and Admin User 
    {
        UserRelationship_id: '8fc429cc-aec4-4cc8-8394-f2aa3f7c125c',
        UserRelationship_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        UserRelationship_relationId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        UserRelationship_status: 'confirmed',
        UserRelationship_createdDate: 'TIMESTAMP',
        UserRelationship_updatedDate: 'TIMESTAMP'
    }

]

const posts = [
    {
        Post_id: '703955d2-77df-4635-8ab8-b9108fef217f',
        Post_type: 'feed',
        Post_visibility: 'private',
        Post_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        Post_fileId: null,
        Post_groupId: null,
        Post_linkPreviewId: null,
        Post_sharedPostId: null,
        Post_activity: 1,
        Post_content: 'This is a test post.',
        Post_createdDate: 'TIMESTAMP',
        Post_updatedDate: 'TIMESTAMP',
    },
    {
        Post_id: '63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d',
        Post_type: 'group',
        Post_visibility: 'private',
        Post_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        Post_fileId: null,
        Post_groupId: '6a9f554b-1ff8-483a-9137-008e412a877e',
        Post_linkPreviewId: null,
        Post_sharedPostId: null,
        Post_activity: 1,
        Post_content: 'This is a test group post.',
        Post_createdDate: 'TIMESTAMP',
        Post_updatedDate: 'TIMESTAMP',
    }
]

const groups = [
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
    },
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

    },
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

const group_members = [
    // User One membership in Test Open Group
    {
        GroupMember_id: '138de5fc-a0a9-47eb-ac51-3c92f7780ad9',
        GroupMember_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6',
        GroupMember_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        GroupMember_status: 'member',
        GroupMember_entranceAnswers: {},
        GroupMember_role: 'member',
        GroupMember_createdDate: 'TIMESTAMP',
        GroupMember_updatedDate: 'TIMESTAMP'
    },
    // User Two membership in Test Private Group
    {
        GroupMember_id: '70f2c9ee-e614-4bb0-bed0-83b42d1b37cd',
        GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        GroupMember_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
        GroupMember_status: 'member',
        GroupMember_entranceAnswers: {},
        GroupMember_role: 'member',
        GroupMember_createdDate: 'TIMESTAMP',
        GroupMember_updatedDate: 'TIMESTAMP'
    },
    // Admin user membership in Test Private Group
    {
        GroupMember_id: '34215650-8088-46b1-9841-2bda331ead1b',
        GroupMember_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f',
        GroupMember_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        GroupMember_status: 'member',
        GroupMember_entranceAnswers: {},
        GroupMember_role: 'member',
        GroupMember_createdDate: 'TIMESTAMP',
        GroupMember_updatedDate: 'TIMESTAMP'
    },
    // Admin user member of Test Hidden Group 
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


const database = { 
    users: [
        { ...users[0] },
        { ...users[1] },
        { ...users[2] }
    ],
    userRelationships: [
        { ...user_relationships[0] }
    ],
    groups: [
        { ...groups[0] },
        { ...groups[1] },
        { ...groups[2] },
    ],
    groupMembers: [
        { ...group_members[0] },
        { ...group_members[1] },
        { ...group_members[2] },
        { ...group_members[3] }
    ],
    posts: [
        { ...posts[0] },
        { ...posts[1] }
    ]
}

module.exports = database 

