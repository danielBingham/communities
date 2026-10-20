/******************************************************************************
 * @deprecated Entity validation (`validation.<Entity>`, from `entities/`) is
 * deprecated in favor of the Schema classes in `packages/shared/schema`, which
 * define both how to clean and how to validate each property of an entity.
 *
 * - Don't add new entities here.  Write a Schema.
 * - When an entity's validation needs to change, move it to a Schema.
 *
 * The field validators in `types/` (`validation.types`) are NOT deprecated:
 * the Schemas are built from them.
 *
 * See packages/shared/validation/README.md.
 ******************************************************************************/
const Blocklist  = require('./entities/Blocklist')
const Group = require('./entities/Group')
const GroupMember = require('./entities/GroupMember')
const GroupModeration = require('./entities/GroupModeration')
const LinkPreview = require('./entities/LinkPreview')
const Post = require('./entities/Post')
const PostComment = require('./entities/PostComment')
const PostReaction = require('./entities/PostReaction')
const PostSubscription = require('./entities/PostSubscription')
const Token = require('./entities/Token')
const User = require('./entities/User')
const UserRelationship = require('./entities/UserRelationship')
const types = require('./types')

module.exports = {
    Blocklist: Blocklist,
    Group: Group,
    GroupMember: GroupMember,
    GroupModeration: GroupModeration,
    LinkPreview: LinkPreview,
    Post: Post,
    PostComment: PostComment,
    PostReaction: PostReaction,
    PostSubscription: PostSubscription,
    Token: Token,
    User: User,
    UserRelationship: UserRelationship,
    types: types 
}
