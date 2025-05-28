/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/
const siteModeration = {
    // User: Moderator User, Post: Private post to a feed by User One 
    '0b5fcc15-0ff0-4d3a-9ea5-fae3979c6659': {
        id: '0b5fcc15-0ff0-4d3a-9ea5-fae3979c6659',
        userId: 'f5e9e853-6803-4a74-98c3-23fb0933062f',
        status: 'approved',
        reason: '',
        postId: '789307dc-fe1f-4d57-ad88-1ecbb8a38a4e',
        postCommentId: null,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User: User One, Post: Private Post to a feed by User Two
    '3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2': {
        id: '3e930e7d-98a9-4cf8-a5cc-5015f3bbfde2',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'flagged',
        reason: null,
        postId: '1457275b-5230-473a-8558-ffce376d77ac',
        postCommentId: null,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // User: User One
    'e79ffadc-7d14-4ce5-aca4-8305677023b3': {
        id: 'e79ffadc-7d14-4ce5-aca4-8305677023b3',
        userId: '5c44ce06-1687-4709-b67e-de76c05acb6a',
        status: 'flagged',
        reason: null,
        postId: null,
        postCommentId: 'e12e046b-d7a3-4a53-aa5a-d057482b72a8',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }
}

module.exports = {
    siteModeration: siteModeration
}
