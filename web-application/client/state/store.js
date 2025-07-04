import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import authenticationReducer from './authentication'
import BlocklistReducer from './Blocklist'
import featuresReducer from './features'
import FileReducer from './File'
import GroupReducer from './Group'
import GroupMemberReducer from './GroupMember'
import GroupModerationReducer from './GroupModeration'
import jobsReducer from './jobs'
import notificationsReducer from './notifications'
import LinkPreviewReducer from './LinkPreview'
import PostReducer from './Post'
import PostCommentReducer from './PostComment'
import PostReactionReducer from './PostReaction'
import PostSubscriptionReducer from './PostSubscription'
import tokensReducer from './tokens'
import SiteModerationReducer from './SiteModeration'
import systemReducer from './system'
import UserReducer from './User'
import UserRelationshipReducer from './UserRelationship'


const reducers = combineReducers({
    authentication: authenticationReducer,
    Blocklist: BlocklistReducer,
    features: featuresReducer,
    File: FileReducer,
    Group: GroupReducer,
    GroupMember: GroupMemberReducer,
    GroupModeration: GroupModerationReducer,
    jobs: jobsReducer,
    notifications: notificationsReducer,
    LinkPreview: LinkPreviewReducer,
    Post: PostReducer,
    PostComment: PostCommentReducer,
    PostReaction: PostReactionReducer,
    PostSubscription: PostSubscriptionReducer,
    tokens: tokensReducer,
    User: UserReducer,
    UserRelationship: UserRelationshipReducer,
    SiteModeration: SiteModerationReducer,
    system: systemReducer
})

const rootReducer = function(state, action) {
    if (action.type === 'system/reset') {
        state = undefined
    }
    return reducers(state,action)
}

export default configureStore({
    reducer: rootReducer
})
