/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

import logger from '/logger'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { updateBadgeCount } from '/lib/notification'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

export const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of notifications we've retrieved from the backend, keyed by
         * notification.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * Structure:
         * {
         *  queryName: {
         *      meta: {
         *          page: <int>,
         *          count: <int>,
         *          pageSize: <int>,
         *          numberOfPages: <int>
         *      },
         *      list: [] 
         *  },
         *  ...
         * }
         */
        queries: {},

        isRegisteredMobile: false,

        isRegisteredDesktop: false

        // ======== Specific State ============================================

    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setNotificationsInDictionary: setInDictionary,
        removeNotification: removeEntity,
        setNotificationQueryResults: setQueryResults,
        clearNotificationQuery: clearQuery,
        clearNotificationQueries: clearQueries,

        // ======== State Specific Manipulation Helpers ====

        appendToQuery: function(state, action) {
            const name = action.payload.name
            const list = action.payload.list

            if ( name in state.queries ) {
                state.queries[name].list = [ ...state.queries[name].list, ...list ]
            } else {
                state.queries[name] = {
                    list: [ ...list ]
                }
            }
        },

        prependToQuery: function(state, action) {
            const name = action.payload.name
            const list = action.payload.list

            if ( name in state.queries ) {
                state.queries[name].list = [ ...list, ...state.queries[name].list ]
            } else {
                state.queries[name] = {
                    list: [ ...list ]
                }
            }

        },

        setIsRegisteredMobile: function(state, action) {
            state.isRegisteredMobile = action.payload
        }
    }
})

/**
 * Determine whether the user has Desktop notifications enabled for this
 * notification type.
 */
const desktopNotificationsAreEnabled = function(settings, entity) {
    const defaultValue = true

    try { 
        // Settings will be blank until they are updated, so we need to check
        // for the missing setting at multiple points and just use the default
        // value if we don't find it.

        // If they don't have any settings or don't have notification settings,
        // then fall back to the default.
        if ( settings === undefined || settings === null || ! ('notifications' in settings) ) {
            return defaultValue
        }

        // If they haven't updated the settings for this entity, then use the
        // default.
        if ( ! (entity.type in settings.notifications) ) {
            return defaultValue
        }

        // If they haven't updated the setting for the desktop notification,
        // then use the default.
        if ( ! ('desktop' in settings.notifications[entity.type] ) ) {
            return defaultValue
        }

        return settings.notifications[entity.type].desktop
    } catch(error) {
        logger.error(`Failed to determine desktop notification setting: `, error)
        return defaultValue 
    }
}

/**
 * Attempt to trigger a Desktop notification for users who are on the web
 * platform in a Desktop browser.  Check the user's settings to ensure they
 * haven't turned off desktop notifications for this notification type.
 */
const triggerDesktopNotification = function(entity) {
    return function(dispatch, getState) {
        try {
            // We should only be sending desktop notifications from a web
            // browser.  If we're on mobile, we handle these differently.
            if ( Capacitor.getPlatform() !== 'web' ) {
                return
            }

            // Only trigger the notification if they have desktop notifications
            // turned on for this entity type.
            const settings = getState().authentication.currentUser?.settings
            if ( desktopNotificationsAreEnabled(settings, entity) !== true ) {
                return
            }

            // Make sure we have the Notifications api.  macOs will remove it
            // from the browser when the user turns on Lockdown Mode.
            if ( ! ("Notification" in window) ) {
                return
            }

            // Make sure permissions have been granted.
            if ( Notification.permission !== 'granted' ) {
                return
            }

            const host = getState().system.host
            const notification = new Notification("Communities", 
                { 
                    body: entity.description, 
                    icon: `${host}/assets/icon-1024x1024.png`,
                    image: `${host}/assets/icon-1024x1024.png`
                }
            )

            notification.addEventListener('click', (event) => {
                try {
                    window.focus()
                    notification.close()
                    window.location.assign(entity.path)
                } catch (error) {
                    logger.error(`Failed to update location to path: `, error) 
                }
            })
        } catch (error) {
            logger.error(`Failed to create a desktop notification: `, error)
        }

    }
}

/**
 * Count the unread notifications in the notification dictionary.
 *
 * NOTE: This will only count the notifications in the dictionary.  It assumes
 * the dictionary has all unread notifications.  If the  frontend has not
 * synced notifications with the backend then this will return an inaccurate
 * count.
 */
const getUnreadNotificationsCount = function(state) {
    try { 
        const notifications = state.notifications.dictionary
        const unreadNotifications = Object.values(notifications).filter((n) => n.isRead !== true)
        const unreadCount = unreadNotifications ? unreadNotifications.length : 0
        return unreadCount
    } catch (error) {
        logger.error(error)
        return 0
    }
}


/**
 * Handle a notification event triggered from the backend and transmitted over
 * the web socket. The event will have either a single entity representing the
 * notification in its context or it will have a dictionary of multiple
 * notifications.
 */
export const handleNotificationEvent = function(event) {
    return function(dispatch, getState) {
        try { 
            if ( event.action === 'create' ) {
                if ( 'entity' in event.context ) {
                    dispatch(notificationsSlice.actions.setNotificationsInDictionary({ entity: event.context.entity }))
                    dispatch(notificationsSlice.actions.prependToQuery({ name: 'NotificationMenu', list: [ event.context.entity.id ] }))

                    const count = getUnreadNotificationsCount(getState())
                    updateBadgeCount(count)

                    dispatch(triggerDesktopNotification(event.context.entity))
                } else if ( 'dictionary' in event.context ) {
                    dispatch(notificationsSlice.actions.setNotificationsInDictionary({ dictionary: event.context.dictionary }))
                    dispatch(notificationsSlice.actions.prependToQuery({ name: 'NotificationMenu', list: Object.values(event.context.dictionary).map((notification) => notification.id) }))

                    const count = getUnreadNotificationsCount(getState())
                    updateBadgeCount(count)

                    for(const [id, entity] of Object.entries(event.context.dictionary)) { 
                        dispatch(triggerDesktopNotification(entity))
                    }
                }
            }
        } catch (error) {
            logger.error(`Failed to handle notification event: `, error)
        }
    }
}

/**
 *  Sync state notifications with delivered notifications on a mobile device.
 *  Not valid on Desktop.
 */
export const syncDeliveredNotifications = function() {
    return async function(dispatch, getState) {
        try { 
            // We can only sync notifications on iOS right now.  On Android,
            // custom data is not currently returned by
            // `getDeliveredNotifications()`, meaning we have no way of syncing
            // up the notifications.
            //
            // TECHDEBT TODO Upgrade Capacitor and see if the issues in
            // PushNotifications are fixed in Capacitor 8.x
            if ( Capacitor.getPlatform() !== 'ios' ) {
                return
            }

            const state = getState()

            // If we have not registered notifications yet, then we need to skip.
            if ( state.notifications.isRegisteredMobile !== true ) {
                return
            }

            const delivered = await PushNotifications.getDeliveredNotifications()
            const toRemove = []
            for(const notification of delivered.notifications) {
                const id = notification?.data?.notificationId
                if ( id === undefined || id === null ) {
                    continue
                }

                const entity = id in state.notifications.dictionary ? state.notifications.dictionary[id] : undefined
                if ( entity === undefined || entity === null) {
                    continue
                }

                if ( entity.isRead === true ) {
                    toRemove.push(notification)
                }
            }

            // Clean out any hanging notifications that are read.
            if ( toRemove.length > 0 ) {
                await PushNotifications.removeDeliveredNotifications({ notifications: toRemove })
            }

            // Update the badge count to the proper unread count.
            await updateBadgeCount(getUnreadNotificationsCount(state))
        } catch (error) {
            logger.error(`Failed to sync delivered notifications: `, error.message)
        }
    }
}

export const clearDeliveredNotifications = function() {
    return async function(dispatch, getState) {
        try { 
            const state = getState()

            // If we have not registered notifications yet, then we need to skip.
            if ( state.notifications.isRegisteredMobile !== true ) {
                return
            }

            await PushNotifications.removeAllDeliveredNotifications()
        } catch (error) {
            logger.error(`Failed to clear delivered notifications: `, error) 
        }
     }
}

/**
 * GET /notifications
 *
 * Get all notifications in the database.  Populates state.notifications.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getNotifications = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/notifications${( params ? '?' + qs.stringify(params) : '')}`

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                if ( ! params?.since ) {
                    dispatch(notificationsSlice.actions.setNotificationsInDictionary({ dictionary: response.dictionary}))

                    dispatch(notificationsSlice.actions.setNotificationQueryResults({ name: name, meta: response.meta, list: response.list }))

                } else {
                    if ( response.list.length > 0 ) {
                        dispatch(notificationsSlice.actions.setNotificationsInDictionary({ dictionary: response.dictionary}))

                        dispatch(notificationsSlice.actions.appendToQuery({ name: name, list: response.list }))
                    }
                }

                dispatch(syncDeliveredNotifications())

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /notifications
 *
 * Update a batch of notifications from a partial `notification` object.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object[]} notifications - A populate notification object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchNotifications = function(notifications) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/notifications`, notifications,
            function(response) {
                dispatch(notificationsSlice.actions.setNotificationsInDictionary({ dictionary: response.dictionary }))

                dispatch(setRelationsInState(response.relations))

                dispatch(syncDeliveredNotifications())
            }
        ))
    }
}

/**
 * PATCH /notification/:id
 *
 * Update a notification from a partial `notification` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} notification - A populate notification object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchNotification = function(notification) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/notification/${encodeURIComponent(notification.id)}`, notification,
            function(response) {
                dispatch(notificationsSlice.actions.setNotificationsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

                dispatch(syncDeliveredNotifications())
            }
        ))
    }
}

export const {  
    setNotificationsInDictionary,
    setIsRegisteredMobile
}  = notificationsSlice.actions

export default notificationsSlice.reducer
