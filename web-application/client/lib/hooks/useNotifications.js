import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { PushNotifications } from '@capacitor/push-notifications'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { patchDevice } from '/state/authentication'


export const useNotifications = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)
    const platform = device?.platform
   
    const [request, makeRequest, resetRequest] = useRequest()

    const navigate = useNavigate()

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
            // Navigate to the notification path.
            if ( action.actionId === 'tap' ) {
                navigate(action.notification.data.path)
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
        if ( currentUser !== null && device !== null ) {
            if ( ! request && (device.platform === 'ios' || device.platform === 'android' )) {
                listenForPushNotifications().then(function() {
                    registerPushNotifications().catch(function(error) {
                        logger.error(error)
                    })
                }).catch(function(error) {
                    logger.error(error)
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
    }, [ currentUser, device, request ])

}
