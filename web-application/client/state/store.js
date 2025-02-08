import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import authenticationReducer from './authentication'
import featuresReducer from './features'
import filesReducer from './files'
import groupsReducer from './groups'
import groupMembersReducer from './groupMembers'
import jobsReducer from './jobs'
import notificationsReducer from './notifications'
import linkPreviewsReducer from './linkPreviews'
import postsReducer from './posts'
import postCommentsReducer from './postComments'
import postReactionsReducer from './postReactions'
import postSubscriptionsReducer from './postSubscriptions'
import requestsReducer from './requests'
import tokensReducer from './tokens'
import systemReducer from './system'
import usersReducer from './users'
import userRelationshipsReducer from './userRelationships'


const reducers = combineReducers({
    authentication: authenticationReducer,
    features: featuresReducer,
    files: filesReducer,
    groups: groupsReducer,
    groupMembers: groupMembersReducer,
    jobs: jobsReducer,
    notifications: notificationsReducer,
    linkPreviews: linkPreviewsReducer,
    posts: postsReducer,
    postComments: postCommentsReducer,
    postReactions: postReactionsReducer,
    postSubscriptions: postSubscriptionsReducer,
    requests: requestsReducer,
    tokens: tokensReducer,
    users: usersReducer,
    userRelationships: userRelationshipsReducer,
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
