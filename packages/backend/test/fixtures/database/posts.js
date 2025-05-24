const posts = {
    // Private post to a feed by Admin User
    '703955d2-77df-4635-8ab8-b9108fef217f': {
        rows: [
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
                Post_content: 'This is a test private post to a feed by Admin User.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null 
            }
        ]
    },
    // Private post to a feed by User One 
    '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e': {
        rows: [
            {
                Post_id: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e',
                Post_type: 'feed',
                Post_visibility: 'private',
                Post_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                Post_fileId: null,
                Post_groupId: null,
                Post_linkPreviewId: null,
                Post_sharedPostId: null,
                Post_activity: 1,
                Post_content: 'This is a test private post to a feed by User One.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null
            }
        ]
    },
    // Private post to a feed by User Two  
    '1457275b-5230-473a-8558-ffce376d77ac': {
        rows: [ 
            {
                Post_id: '1457275b-5230-473a-8558-ffce376d77ac',
                Post_type: 'feed',
                Post_visibility: 'private',
                Post_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                Post_fileId: null,
                Post_groupId: null,
                Post_linkPreviewId: null,
                Post_sharedPostId: null,
                Post_activity: 1,
                Post_content: 'This is a test private post to a feed by User Two.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null
            }
        ]
    },
    // Public post to a feed by Admin User
    'e792718e-6730-438e-85f7-a5172af3d740': {
        rows: [
            {
                Post_id: '703955d2-77df-4635-8ab8-b9108fef217f',
                Post_type: 'feed',
                Post_visibility: 'public',
                Post_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                Post_fileId: null,
                Post_groupId: null,
                Post_linkPreviewId: null,
                Post_sharedPostId: null,
                Post_activity: 1,
                Post_content: 'This is a test private post to a feed.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null
            }
        ]
    },
    // Private post to Test Private Group group by Admin User
    '63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d': {
        rows: [
            {
                Post_id: '63b6fdfc-bdcc-4b55-90d8-eb8fcaba715d',
                Post_type: 'group',
                Post_visibility: 'private',
                Post_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                Post_fileId: null,
                Post_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f', // private group
                Post_linkPreviewId: null,
                Post_sharedPostId: null,
                Post_activity: 1,
                Post_content: 'This is a test private post to a private group.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null
            }
        ]
    },
    // Public post to an Test Open Group by Admin User 
    '01f39e3e-e1f4-4ae2-bced-dcb9619ea3de': {
        rows: [
            {
                Post_id: '01f39e3e-e1f4-4ae2-bced-dcb9619ea3de',
                Post_type: 'group',
                Post_visibility: 'public',
                Post_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                Post_fileId: null,
                Post_groupId: 'aeb26ec5-3644-4b7a-805e-375551ec65b6', // Open group
                Post_linkPreviewId: null,
                Post_sharedPostId: null,
                Post_activity: 1,
                Post_content: 'This is a test public post to an open group.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null
            }
        ]
    },
    // Private post to Test Hidden Group by Admin User 
    '832d3206-d6f3-4ed4-9028-8ef2045485a3': {
        rows: [
            {
                Post_id: '832d3206-d6f3-4ed4-9028-8ef2045485a3',
                Post_type: 'group',
                Post_visibility: 'private',
                Post_userId: '469931f6-26f2-4e1c-b4a0-849aed14e977',
                Post_fileId: null,
                Post_groupId: '4e66c241-ef21-4143-b7b4-c4fe81a34acd', // Open group
                Post_linkPreviewId: null,
                Post_sharedPostId: null,
                Post_activity: 1,
                Post_content: 'This is a test private post to a hidden group.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null
            }
        ]
    },
    // Private post to Test Private Group group by User Two 
    'e9f73a4a-bdaa-4633-9a8e-bea636f651a1': {
        rows: [
            {
                Post_id: 'e9f73a4a-bdaa-4633-9a8e-bea636f651a1',
                Post_type: 'group',
                Post_visibility: 'private',
                Post_userId: '2a7ae011-689c-4aa2-8f13-a53026d40964',
                Post_fileId: null,
                Post_groupId: '8661a1ef-6259-4d5a-a59f-4d75929a765f', // private group
                Post_linkPreviewId: null,
                Post_sharedPostId: null,
                Post_activity: 1,
                Post_content: 'This is a test private post to a private group.',
                Post_createdDate: 'TIMESTAMP',
                Post_updatedDate: 'TIMESTAMP',
                Post_postReactionId: null,
                Post_postCommentId: null
            }
        ]
    },
}

module.exports = {
    posts: posts
}
