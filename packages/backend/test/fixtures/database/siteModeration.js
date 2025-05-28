const siteModeration = {
    // User: Moderator User, Post: Private post to a feed by User One 
    '0b5fcc15-0ff0-4d3a-9ea5-fae3979c6659': {
        rows: [
            {
                SiteModeration_id: '0b5fcc15-0ff0-4d3a-9ea5-fae3979c6659',
                SiteModeration_userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
                SiteModeration_status: 'approved',
                SiteModeration_reason: '',
                SiteModeration_postId: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e',
                SiteModeration_postCommentId: null,
                SiteModeration_createdDate: 'TIMESTAMP',
                SiteModeration_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User: User One, Post: Private Post to a feed by User Two
    '3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2': {
        rows: [
            {
                SiteModeration_id: '3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2',
                SiteModeration_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                SiteModeration_status: 'flagged',
                SiteModeration_reason: null,
                SiteModeration_postId: '1457275b-5230-473a-8558-ffce376d77ac',
                SiteModeration_postCommentId: null,
                SiteModeration_createdDate: 'TIMESTAMP',
                SiteModeration_updatedDate: 'TIMESTAMP'
            }
        ]
    },
    // User: User One
    'e79ffadc-7d14-4ce5-aca4-8305677023b3': {
        rows: [
            {
                SiteModeration_id: 'e79ffadc-7d14-4ce5-aca4-8305677023b3',
                SiteModeration_userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
                SiteModeration_status: 'flagged',
                SiteModeration_reason: null,
                SiteModeration_postId: null,
                SiteModeration_postCommentId: 'e12e046b-d7a3-4a53-aa5a-d057482b72a8',
                SiteModeration_createdDate: 'TIMESTAMP',
                SiteModeration_updatedDate: 'TIMESTAMP'
            }
        ]
    }
}

module.exports = {
    siteModeration: siteModeration
}
