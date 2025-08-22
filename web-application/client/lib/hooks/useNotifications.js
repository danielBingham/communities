import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { PushNotifications } from '@capacitor/push-notifications'

import { useRequest } from '/lib/hooks/useRequest'

import { patchDevice } from '/state/authentication'



export const useNotifications = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)
   
    const [request, makeRequest, resetRequest] = useRequest()

    const listenForPushNotifications = async function() {
        await PushNotifications.addListener('registration', (token) => {

        })

        await PushNotifications.addListener('registrationError', (error) => {
            console.error(`Push Notification Registration failed:: `, error)

        })

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {

        })

        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {

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

    useEffect(function() {
        if ( currentUser !== null && device !== null ) {
            if ( device.platform === 'ios' || device.platform === 'android' ) {
                listenForPushNotifications().then(function() {
                    registerPushNotifications()
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

        return () => {
            if ( device !== null ) {
                if ( device.platform === 'ios' || device.platform === 'android' ) {
                    PushNotifications.removeAllListeners()
                }
            }
        }
    }, [ currentUser, device, request ])

}
