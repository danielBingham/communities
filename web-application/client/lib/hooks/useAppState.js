import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

import logger from '/logger'

import { getAuthentication } from '/state/authentication'
import { getNotifications } from '/state/notifications'
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
                logger.debug(`App state change: `, event.isActive)
                dispatch(setIsActive(event.isActive))
                if ( event.isActive ) {
                    // Refresh the currentUser
                    makeAuthenticationRequest(getAuthentication())

                    // Refresh our notifications.
                    if ( currentUser ) {
                        makeNotificationRequest(getNotifications('NotificationMenu'))
                    }
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
