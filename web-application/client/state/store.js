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
import notificationsReducer, { handleNotificationEvent } from './notifications'
import LinkPreviewReducer from './LinkPreview'
import PostReducer from './Post'
import PostCommentReducer from './PostComment'
import PostReactionReducer from './PostReaction'
import PostSubscriptionReducer from './PostSubscription'
import tokensReducer from './tokens'
import SiteModerationReducer from './SiteModeration'
import systemReducer from './system'
import socketReducer, { connect as socketConnect, disconnect as socketDisconnect, open as socketOpen, close as socketClose } from './socket'
import UserReducer from './User'
import UserRelationshipReducer from './UserRelationship'

import Socket, { SocketError } from '/lib/Socket' 

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
    socket: socketReducer,
    system: systemReducer
})

const rootReducer = function(state, action) {
    if (action.type === 'system/reset') {
        state = undefined
    }
    return reducers(state,action)
}


// Wire up the WebSocket.
const rootSocket = new Socket()
export const createSocketMiddleware = function(socket) {
    return function({ dispatch, getState }) {
        return function(next) {
            return function(action) {
                const state = getState()

                if ( action.type === socketConnect.type ) {
                    socket.connect(state.system.configuration.wsHost)

                    /**********************************************************
                     * Open Connection Handler
                     **********************************************************/
                    socket.on('open', () => { 
                        console.log(`Socket connected...`)
                        dispatch(socketOpen()) 
                    })

                    socket.on('message', (event) => {
                        if ( event.entity === 'Notification' ) {
                            dispatch(handleNotificationEvent(event))
                        }
                    })

                    socket.on('close', () => { 
                        console.log(`Socket closed...`)
                        dispatch(socketClose()) 

                    })

                } else if ( action.type === socketDisconnect.type ) {
                    socket.disconnect() 
                }
                return next(action)
            }
        }
    }
}

export default configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(createSocketMiddleware(rootSocket))
})
