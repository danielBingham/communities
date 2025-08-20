import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import authenticationReducer from './authentication'
import BlocklistReducer from './Blocklist'
import eventsSliceReducer, { subscribe, unsubscribe, confirmSubscription, confirmUnsubscription, clearSubscriptions } from './events'
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
import socketReducer, { connect, disconnect, open, close } from './socket'
import UserReducer from './User'
import UserRelationshipReducer from './UserRelationship'

import Socket, { SocketError } from '/lib/Socket' 

const reducers = combineReducers({
    authentication: authenticationReducer,
    Blocklist: BlocklistReducer,
    events: eventsSliceReducer,
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
                const currentUser = state.authentication.currentUser

                if ( action.type === connect.type ) {
                    console.log(`Attempting socket connection...`)
                    socket.connect(state.system.configuration.wsHost)

                    /**********************************************************
                     * Open Connection Handler
                     **********************************************************/
                    socket.on('open', () => { 
                        console.log(`Socket connected...`)
                        dispatch(open()) 
                    })

                    socket.on('message', (event) => {
                        console.log(`Message recieved...`)
                        if ( event.action === 'confirmSubscription' ) {
                            dispatch(confirmSubscription({ entity: event.entity, action: event.context.action }))
                        } else if ( event.action === 'confirmUnsubscription' ) {
                            dispatch(confirmUnsubscription({ entity: event.entity, action: event.context.action }))
                        } else if ( event.entity === 'Notification' ) {
                            dispatch(handleNotificationEvent(event))
                        }
                    })

                    socket.on('close', () => { 
                        console.log(`Socket closed...`)
                        dispatch(clearSubscriptions())
                        dispatch(close()) 
                    })

                } else if ( action.type === subscribe.type ) {
                    console.log(`Subscribing to Event(${action.payload.entity}:${action.payload.action}).`)
                    const event = {
                        entity: action.payload.entity,
                        audience: currentUser?.id,
                        action: 'subscribe',
                        context: {
                            action: action.payload.action
                        }
                    }
                    socket.send(event)
                } else if ( action.type === unsubscribe.type ) {
                    console.log(`Unsubscribing from Event(${action.payload.entity}:${action.payload.action}).`)
                    const event = {
                        entity: action.payload.entity,
                        audience: currentUser?.id,
                        action: 'unsubscribe',
                        context: {
                            action: action.payload.action
                        }
                    }
                    socket.send(event)
                } else if ( action.type === disconnect.type ) {
                    console.log(`Disconnecting...`)
                    dispatch(clearSubscriptions())
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
