import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { App } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { removeDeliveredNotificationById, updateBadgeCount } from '/lib/pushNotificationUtils'

import { patchNotification } from '/state/notifications'
import { patchDevice } from '/state/authentication'


export const useNotifications = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)
    const platform = device?.platform
   
    const [request, makeRequest, resetRequest] = useRequest()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const listenForPushNotifications = async function() {
        await PushNotifications.addListener('registration', (token) => {
            if ( ! request ) {
                makeRequest(patchDevice({ deviceToken: token.value }))
            }
        })

        await PushNotifications.addListener('registrationError', (error) => {
            logger.error(`Push Notification Registration failed:: `, error)
        })

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            // Do nothing.  The notification will be handled through the event system.
        })

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            if ( action.actionId === 'tap' ) {
                const notificationData = action.notification.data
                const notificationId = notificationData?.notificationId
                const path = notificationData?.path

                // Navigate to the notification's target path.
                if ( path ) {
                    navigate(path)
                }

                // Mark the notification as read in the Communities database.
                if ( notificationId && currentUser ) {
                    try {
                        const [promise] = dispatch(patchNotification({
                            id: notificationId,
                            userId: currentUser.id,
                            isRead: true
                        }))
                        promise.catch((error) => logger.error(`Failed to mark notification as read: `, error))
                    } catch(error) {
                        logger.error(`Failed to dispatch patchNotification: `, error)
                    }
                }

                // Update the app icon badge count.
                updateBadgeCount()
            }
        })
    } 

    const registerPushNotifications = async function() {
        let status = await PushNotifications.checkPermissions()

        if ( status.receive === 'prompt' ) {
            status = await PushNotifications.requestPermissions()
        }

        if ( status.receive !== 'granted' ) {
            console.error(`Push Notification Registration:: Permission Denied.`)
        } else {
            await PushNotifications.register()
        }
    }

    // TODO TECHDEBT We should separate the notification settings from the
    // device so they can be updated separately without triggering effect
    // loops.
    useEffect(function() {
        return () => {
            if ( platform !== undefined && platform !== null) {
                if ( platform === 'ios' || platform === 'android' ) {
                    PushNotifications.removeAllListeners()
                }
            }
        }
    }, [ platform ])

    useEffect(function() {
        try { 
            if ( currentUser !== null && device !== null ) {
                if ( ! request && (device.platform === 'ios' || device.platform === 'android' )) {
                    listenForPushNotifications().then(function() {
                        registerPushNotifications().catch(function(error) {
                            logger.error(error)
                        })
                    }).catch(function(error) {
                        logger.error(`First Error in useNotifications: `, error)
                    })
                }  else if ( device.platform === 'web' ) {
                    if ( ! ("notificationPermission" in device) && "Notification" in window ) {
                        if ( Notification.permission === 'granted' || Notification.permission === 'denied' ) {
                            if ( ! request ) {
                                makeRequest(patchDevice({ notificationPermission: Notification.permission }))
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error(`Second Error in useNotifications: `, error)
        }
            

    }, [ currentUser, device, request ])

}
