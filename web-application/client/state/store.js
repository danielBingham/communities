import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import authenticationReducer from './authentication'
import featuresReducer from './features'
import filesReducer from './files'
import jobsReducer from './jobs'
import notificationsReducer from './notifications'
import linkPreviewsReducer from './linkPreviews'
import postsReducer from './posts'
import postCommentsReducer from './postComments'
import postReactionsReducer from './postReactions'
import postSubscriptionsReducer from './postSubscriptions'
import tagsReducer from './tags'
import systemReducer from './system'
import usersReducer from './users'
import userRelationshipsReducer from './userRelationships'


const reducers = combineReducers({
    system: systemReducer,
    features: featuresReducer,
    jobs: jobsReducer,
    authentication: authenticationReducer,
    users: usersReducer,
    userRelationships: userRelationshipsReducer,
    notifications: notificationsReducer,
    linkPreviews: linkPreviewsReducer,
    posts: postsReducer,
    postComments: postCommentsReducer,
    postReactions: postReactionsReducer,
    postSubscriptions: postSubscriptionsReducer,
    tags: tagsReducer,
    files: filesReducer,
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
