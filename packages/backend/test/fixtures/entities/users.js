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
        siteRole: 'user',
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
        siteRole: 'user',
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
        siteRole: 'user',
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
    'f5e9e853-6803-4a74-98c3-23fb0933062f': {
        id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
        fileId: '9fcb6b9a-55a0-44e4-9f88-50fd22874325',
        name: 'Moderator User',
        username: 'moderator.user',
        email: 'moderator@mailinator.com',
        status: 'confirmed',
        permissions: 'moderator',
        siteRole: 'moderator',
        settings: {
            notifications: {}
        },
        notices: {},
        about: 'An moderator with a bio.',
        location: '',
        invitations: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    '4b660bba-3e58-493f-86e1-ec3c651acc40': {
        id: '4b660bba-3e58-493f-86e1-ec3c651acc40',
        fileId: '9fcb6b9a-55a0-44e4-9f88-50fd22874325',
        name: 'Admin User',
        username: 'admin.user',
        email: 'admin@mailinator.com',
        status: 'confirmed',
        permissions: 'admin',
        siteRole: 'admin',
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
    '469931f6-26f2-4e1c-b4a0-849aed14e977': {
        id: '469931f6-26f2-4e1c-b4a0-849aed14e977',
        fileId: '9fcb6b9a-55a0-44e4-9f88-50fd22874325',
        name: 'Superadmin User',
        username: 'superadmin.user-test',
        email: 'superadmin-user@mailinator.com',
        status: 'confirmed',
        permissions: 'superadmin',
        siteRole: 'superadmin',
        settings: {
            notifications: {}
        },
        notices: {},
        about: 'An superadmin with a bio.',
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

module.exports = {
    users: users,
    userRelationships: userRelationships
}
