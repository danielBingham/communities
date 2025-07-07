const LinkPreview = require('./entities/LinkPreview')
const Post = require('./entities/Post')
const PostSubscription = require('./entities/PostSubscription')
const GroupModeration = require('./entities/GroupModeration')

module.exports = {
    GroupModeration: GroupModeration,
    LinkPreview: LinkPreview,
    Post: Post,
    PostSubscription: PostSubscription
}
