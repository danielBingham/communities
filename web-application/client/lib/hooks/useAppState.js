import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

import logger from '/logger'

import { getAuthentication } from '/state/authentication'
import { getNotifications, clearDeliveredNotifications } from '/state/notifications'
import { setIsActive } from '/state/system'

import { useRequest } from '/lib/hooks/useRequest'

// If this is a native app, then listen for the app to change state and refresh
// certain app data whenever it becomes active.
export const useAppState = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [ authenticationRequest, makeAuthenticationRequest ] = useRequest()
    const [ notificationRequest, makeNotificationRequest ] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        // If this is mobile, refresh authentication anytime the app is
        // brought back to the foreground.
        if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
            App.addListener('appStateChange', (event) => {
                try { 
                    dispatch(setIsActive(event.isActive))
                    if ( event.isActive ) {
                        // Refresh the currentUser
                        makeAuthenticationRequest(getAuthentication())

                        // Refresh our notifications.
                        if ( currentUser ) {
                            makeNotificationRequest(getNotifications('NotificationMenu'))

                            // On iOS, the getNotifications() call will sync
                            // the delivered notifications with the backend's
                            // notifications.  
                            //
                            // On Android, the custom data isn't passed so we
                            // can't match a delivered notification to its
                            // backend notification. Instead, we just clear
                            // them whenever the user opens the app.
                            if ( Capacitor.getPlatform() === 'android' ) {
                                dispatch(clearDeliveredNotifications())
                            }
                        }

                    }
                } catch ( error ) {
                    logger.error(`Error handling app state change: `, error)
                }
            })
        }

        return () => {
            if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
                App.removeAllListeners()
            }
        }
    }, [ currentUser ])
}
