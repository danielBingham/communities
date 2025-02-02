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

const database = { 
    users: {
        1: [
            { ...users[0] }
        ],
        2: [
            { ...users[1] },
        ],
        3: [
            { ...users[2] },
        ]
    }
}

module.exports = {
    database: database
}


