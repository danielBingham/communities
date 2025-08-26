import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { PushNotifications } from '@capacitor/push-notifications'

import { useRequest } from '/lib/hooks/useRequest'

import { patchDevice } from '/state/authentication'



export const useNotifications = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)
    const platform = device?.platform
   
    const [request, makeRequest, resetRequest] = useRequest()

    const listenForPushNotifications = async function() {
        await PushNotifications.addListener('registration', (token) => {
            console.log(`Got a Push Notification Token: `, token)
            console.log(`Existing request? `, request)
            if ( ! request ) {
                makeRequest(patchDevice({ iosDeviceToken: token.value }))
            }
        })

        await PushNotifications.addListener('registrationError', (error) => {
            console.error(`Push Notification Registration failed:: `, error)

        })

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log(`Notification Received: `, notification)
        })

        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log(`Notification action performed: `, notification)

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
        console.log(`Platform changed: `, platform)
        return () => {
            console.log(`Cleanup platform: `, platform)
            if ( platform !== undefined && platform !== null) {
                if ( platform === 'ios' || platform === 'android' ) {
                    PushNotifications.removeAllListeners()
                }
            }
        }
    }, [ platform ])

    useEffect(function() {
        if ( currentUser !== null && device !== null ) {
            console.log(`Have device and user.`)
            if ( ! request && (device.platform === 'ios' || device.platform === 'android' )) {
                console.log(`Setting up Push Notifications: `)
                console.log(`Device: `, device)
                console.log(`Request: `, request)
                listenForPushNotifications().then(function() {
                    console.log(`Registering Push Notifications...`)
                    registerPushNotifications().catch(function(error) {
                        console.error(error)
                    })
                }).catch(function(error) {
                    console.error(error)
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
