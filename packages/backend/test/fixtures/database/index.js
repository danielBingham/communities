
const { users, userRelationships } = require('./users')
const { posts } = require('./posts')
const { groups, groupMembers } = require('./groups')
const { siteModeration } = require('./siteModeration')

module.exports = {
    users: users,
    userRelationships: userRelationships,
    posts: posts,
    groups: groups,
    groupMembers: groupMembers,
    siteModeration: siteModeration
}
