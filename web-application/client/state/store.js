import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import authenticationReducer from './authentication'
import featuresReducer from './features'
import filesReducer from './files'
import jobsReducer from './jobs'
import notificationsReducer from './notifications'
import postsReducer from './posts'
import postCommentsReducer from './postComments'
import postReactionsReducer from './postReactions'
import tagsReducer from './tags'
import systemReducer from './system'
import usersReducer from './users'


const reducers = combineReducers({
    system: systemReducer,
    features: featuresReducer,
    jobs: jobsReducer,
    authentication: authenticationReducer,
    users: usersReducer,
    notifications: notificationsReducer,
    posts: postsReducer,
    postComments: postCommentsReducer,
    postReactions: postReactionsReducer,
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
