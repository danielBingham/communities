const users = {
    '5c44ce06-1687-4709-b67e-de76c05acb6a': {
        rows: [
            {
                User_id: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                User_fileId: null,
                User_name: 'User One',
                User_username: 'User One',
                User_email: 'user.one@mailinator.com',
                User_status: 'confirmed',
                User_permissions: 'user',
                User_siteRole: 'user',
                User_settings: {},
                User_notices: {},
                User_about: '',
                User_location: '',
                User_invitations: 50,
                User_createdDate: 'TIMESTAMP',
                User_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    '2a7ae011-689c-4aa2-8f13-a53026d40964': {
        rows: [
            {
                User_id: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                User_fileId: 'f6cf86ab-98e5-4246-9310-41bc7c6c559a',
                User_name: 'User Two',
                User_username: 'user-two',
                User_email: 'user-two@mailinator.com',
                User_status: 'confirmed',
                User_permissions: 'user',
                User_siteRole: 'user',
                User_settings: {
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
                User_notices: {},
                User_about: '',
                User_location: '',
                User_invitations: 50,
                User_createdDate: 'TIMESTAMP',
                User_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    'cd33814b-2381-4b55-b108-3395b8866792': {
        rows: [
            {
                User_id: 'cd33814b-2381-4b55-b108-3395b8866792',
                User_fileId: 'f6cf86ab-98e5-4246-9310-41bc7c6c559a',
                User_name: 'User Three',
                User_username: 'user-three.4',
                User_email: 'user-three.4@mailinator.com',
                User_status: 'confirmed',
                User_permissions: 'user',
                User_siteRole: 'user',
                User_settings: {
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
                User_notices: {},
                User_about: 'This is a test bio.',
                User_location: '',
                User_invitations: 45,
                User_createdDate: 'TIMESTAMP',
                User_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    'f5e9e853-6803-4a74-98c3-23fb0933062f': {
        rows: [
            {
                User_id: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                User_fileId: '9fcb6b9a-55a0-44e4-9f88-50fd22874325',
                User_name: 'Moderator User',
                User_username: 'moderator.user',
                User_email: 'moderator@mailinator.com',
                User_status: 'confirmed',
                User_permissions: 'moderator',
                User_siteRole: 'moderator',
                User_settings: {
                    notifications: {}
                },
                User_notices: {},
                User_about: 'An moderator with a bio.',
                User_location: '',
                User_invitations: 50,
                User_createdDate: 'TIMESTAMP',
                User_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    '4b660bba-3e58-493f-86e1-ec3c651acc40': {
        rows: [
            {
                User_id: '4b660bba-3e58-493f-86e1-ec3c651acc40',
                User_fileId: '9fcb6b9a-55a0-44e4-9f88-50fd22874325',
                User_name: 'Admin User',
                User_username: 'admin.user',
                User_email: 'admin@mailinator.com',
                User_status: 'confirmed',
                User_permissions: 'admin',
                User_siteRole: 'admin',
                User_settings: {
                    notifications: {}
                },
                User_notices: {},
                User_about: 'An admin with a bio.',
                User_location: '',
                User_invitations: 50,
                User_createdDate: 'TIMESTAMP',
                User_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    '469931f6-26f2-4e1c-b4a0-849aed14e977': {
        rows: [
            {
                User_id: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                User_fileId: '9fcb6b9a-55a0-44e4-9f88-50fd22874325',
                User_name: 'Superadmin User',
                User_username: 'superadmin.user-test',
                User_email: 'superadmin-user@mailinator.com',
                User_status: 'confirmed',
                User_permissions: 'superadmin',
                User_siteRole: 'superadmin',
                User_settings: {
                    notifications: {}
                },
                User_notices: {},
                User_about: 'An superadmin with a bio.',
                User_location: '',
                User_invitations: 50,
                User_createdDate: 'TIMESTAMP',
                User_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    '032563a3-1a0d-42f2-ad85-aef588b81ebe': {
        rows: [
            {
                User_id: '032563a3-1a0d-42f2-ad85-aef588b81ebe',
                User_fileId: null,
                User_name: '',
                User_username: '',
                User_email: 'test@test.com',
                User_status: 'invited',
                User_permissions: 'user',
                User_settings: {},
                User_notices: {},
                User_about: null,
                User_location: '',
                User_invitations: 50,
                User_createdDate: 'TIMESTAMP',
                User_updatedDate: 'TIMESTAMP'
            }
        ]
    }
}

const userRelationships = {
    // Confirmed Relationship between Admin User and User One
    '8fc429cc-aec4-4cc8-8394-f2aa3f7c125c': {
        rows: [
            {
                UserRelationship_id: '8fc429cc-aec4-4cc8-8394-f2aa3f7c125c',
                UserRelationship_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                UserRelationship_relationId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                UserRelationship_status: 'confirmed',
                UserRelationship_createdDate: 'TIMESTAMP',
                UserRelationship_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // Confirmed Relationship between User Two and Admin User
    '7dac4233-3605-4abd-8528-21f15c4e4126': {
        rows: [
            {
                UserRelationship_id: '7dac4233-3605-4abd-8528-21f15c4e4126',
                UserRelationship_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                UserRelationship_relationId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                UserRelationship_status: 'confirmed',
                UserRelationship_createdDate: 'TIMESTAMP',
                UserRelationship_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // Confirmed Relationship between User Two and User One 
    '5c03d0d2-da31-44c2-9a50-1ae524c23c1d': {
        rows: [
            {
                UserRelationship_id: '5c03d0d2-da31-44c2-9a50-1ae524c23c1d',
                UserRelationship_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                UserRelationship_relationId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                UserRelationship_status: 'confirmed',
                UserRelationship_createdDate: 'TIMESTAMP',
                UserRelationship_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // Pending Relationship between User Three and Admin User
    '42c63d92-dfbb-44a3-b5ba-eb6374f73c72': {
        rows: [
            {
                UserRelationship_id: '42c63d92-dfbb-44a3-b5ba-eb6374f73c72',
                UserRelationship_userId: 'cd33814b-2381-4b55-b108-3395b8866792',
                UserRelationship_relationId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                UserRelationship_status: 'pending',
                UserRelationship_createdDate: 'TIMESTAMP',
                UserRelationship_updatedDate: 'TIMESTAMP'
            }
        ]
    }
}

module.exports = {
    users: users,
    userRelationships: userRelationships
}
