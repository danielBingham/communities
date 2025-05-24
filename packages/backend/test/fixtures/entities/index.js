/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/

const { users, userRelationships } = require('./users')
const { posts } = require('./posts')
const { groups, groupMembers } = require('./groups')
const { siteModeration } = require('./siteModeration')

/**
 * Export the entities in the form of the `results` objects returned by our 
 * GET /resources endpoints.
 */
module.exports = {
    users: {
        dictionary: users,
        list: Object.values(users),
        meta: {
            count: Object.keys(users).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    userRelationships: {
        dictionary: userRelationships,
        list: Object.values(userRelationships),
        meta: {
            count: Object.keys(userRelationships).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    posts: {
        dictionary: posts,
        list: Object.values(posts),
        meta: {
            count: Object.keys(posts).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    groups: {
        dictionary: groups,
        list: Object.values(groups),
        meta: {
            count: Object.keys(groups).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    groupMembers: {
        dictionary: groupMembers,
        list: Object.values(groupMembers),
        meta: {
            count: Object.keys(groupMembers).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    siteModeration: {
        dictionary: siteModeration,
        list: Object.values(siteModeration),
        meta: {
            count: Object.keys(siteModeration).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    }
}
