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
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { resetEntities } from '/state/lib'
import { patchNotification, setIsRegisteredMobile, syncDeliveredNotifications, clearDeliveredNotifications } from '/state/notifications'
import { patchDevice } from '/state/authentication'


export const useNotifications = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)
   
    const [request, makeRequest, resetRequest] = useRequest()
    const [notificationRequest, makeNotificationRequest] = useRequest()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const listenForPushNotifications = async function() {
        await PushNotifications.addListener('registration', (token) => {
            try { 
                if ( ! request ) {
                    makeRequest(patchDevice({ deviceToken: token.value }))
                    dispatch(setIsRegisteredMobile(true))

                    // On iOS, the getNotifications() call will sync
                    // the delivered notifications with the backend's
                    // notifications.  
                    //
                    // On Android, the custom data isn't passed so we
                    // can't match a delivered notification to its
                    // backend notification. Instead, we just clear
                    // them whenever the user opens the app.
                    if ( Capacitor.getPlatform() === 'ios' ) {
                        dispatch(syncDeliveredNotifications())
                    } else if ( Capacitor.getPlatform() === 'android' ) {
                        dispatch(clearDeliveredNotifications())
                    }
                }
            } catch (error) {
                logger.error(`Failed responding to registration: `, error)
            }
        })

        await PushNotifications.addListener('registrationError', (error) => {
            try { 
                dispatch(setIsRegisteredMobile(false))
                logger.error(`Push Notification Registration failed:: `, error)
            } catch (error) {
                logger.error(`Failed registrationError handling: `, error)
            }
        })

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            // Do nothing.  The notification will be handled through the event system.
        })

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            if ( action.actionId === 'tap' ) {
                try { 
                    const notificationData = action.notification.data
                    const notificationId = notificationData?.notificationId
                    const path = notificationData?.path

                    // Mark the notification as read in the Communities database.
                    if ( notificationId && currentUser ) {
                        try {
                            makeNotificationRequest(patchNotification({
                                id: notificationId,
                                userId: currentUser.id,
                                isRead: true
                            }))
                        } catch(error) {
                            logger.error(`Failed to dispatch patchNotification: `, error)
                        }
                    }

                    dispatch(resetEntities())

                    // Navigate to the notification's target path.
                    if ( path ) {
                        navigate(path)
                    }
                } catch (error) {
                    logger.error(`Failed to handle push notification action: `, error)
                }
            }
        })
    } 

    const registerPushNotifications = async function() {
        try { 
            let status = await PushNotifications.checkPermissions()

            if ( status.receive === 'prompt' ) {
                status = await PushNotifications.requestPermissions()
            }

            if ( status.receive !== 'granted' ) {
                console.error(`Push Notification Registration:: Permission Denied.`)
            } else {
                await PushNotifications.register()
            }
        } catch (error) {
            logger.error(`Failed to register push notifications: `, error)
        }
    }

    useEffect(() => {
        return () => {
            try { 
                if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
                    PushNotifications.removeAllListeners().catch((error) => {
                        logger.error(`Failed to remove push notification listeners: `, error)
                    })
                }
            } catch (error) {
                logger.error(`Failed to remove push notification listeners: `, error)
            }
        }
    }, [])

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
