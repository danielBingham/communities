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


const database = { 
    users: [
        { ...users[0] },
        { ...users[1] },
        { ...users[2] }
    ],
    groups: [
        { ...groups[0] },
        { ...groups[1] },
        { ...groups[2] },
    ]
}

module.exports = database 

