import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'
import { patchDevice } from '/state/authentication'

import Toggle from '/components/generic/toggle/Toggle'
import { RequestErrorModal } from '/components/errors/RequestError'

import './NotificationSetting.css'

const NotificationSetting = function({ label, explanation, notifications }) {
    const [request, makeRequest] = useRequest()
    const [deviceRequest, makeDeviceRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const device = useSelector((state) => state.authentication.device)
    const notificationSettings = 'notifications' in currentUser.settings ? currentUser.settings.notifications : {}

    const toggleSettings = function(current, type) {
        const settings = JSON.parse(JSON.stringify(currentUser.settings)) 

        if ( ! ("notifications" in settings) ) {
            settings.notifications = {}
        }

        let enableDesktop = false
        for( const notification of notifications ) {
            if ( ! (notification in settings.notifications ) ) { 
                settings.notifications[notification] = {
                    web: true,
                    email: true,
                    desktop: true,
                    mobile: true
                }
            } 

            if ( type === 'silence' && current === false) {
                settings.notifications[notification].web = false 
                settings.notifications[notification].email = false 
                settings.notifications[notification].desktop = false
                settings.notifications[notification].mobile = false
            } else if ( type === 'silence' && current === true) {
                settings.notifications[notification].web = true
                settings.notifications[notification].email = true 
                settings.notifications[notification].desktop = true
                settings.notifications[notification].mobile = true
            } else {
                settings.notifications[notification][type] = ! current
            }

            if ( settings.notifications[notification].desktop === true ) {
                enableDesktop = true
            }
        }

        // Reset the notification permissions so that we will re-request
        // permission if we need to.
        if ( enableDesktop === true && device.platform === 'web' && device.notificationPermission !== 'granted' ) {
            makeDeviceRequest(patchDevice({ notificationPermission: null }))
        }


        const userPatch = {
            id: currentUser.id,
            settings: settings
        }

        makeRequest(patchUser(userPatch))
    }

    let isEmailOn = false 
    for(const notification of notifications) {
        if ( notification in notificationSettings ) {
            isEmailOn = isEmailOn || notificationSettings[notification].email
        } else if ( ! (notification in notificationSettings) ) {
            isEmailOn = isEmailOn || true
        }
    }

    let isWebOn = false
    for(const notification of notifications) {
        if ( notification in notificationSettings ) {
            isWebOn = isWebOn || notificationSettings[notification].web
        } else if ( ! (notification in notificationSettings) ) {
            isWebOn = isWebOn || true
        }
    }

    let isDesktopOn = false
    for(const notification of notifications) {
        if ( notification in notificationSettings ) {
            isDesktopOn = isDesktopOn || notificationSettings[notification].desktop
        } else if ( ! (notification in notificationSettings) ) {
            isDesktopOn = isDesktopOn || true
        }
    }

    let isMobileOn = false
    for(const notification of notifications) {
        if ( notification in notificationSettings ) {
            isMobileOn = isMobileOn || notificationSettings[notification].mobile
        } else if ( ! (notification in notificationSettings) ) {
            isMobileOn = isMobileOn || true
        }
    }

    const isSilenced = ! isWebOn && ! isEmailOn && ! isDesktopOn && ! isMobileOn


    return (
        <div className="notification-setting">
            <div className="notification-setting__label">{ label }</div>
            <div className="notification-setting__explanation">{ explanation }</div>
            <Toggle 
                label="Silence"
                explanation="...receive no notification of any kind."
                toggled={isSilenced} 
                onClick={(e) => toggleSettings(isSilenced, 'silence')} />
            <Toggle
                label="Desktop"
                explanation="...receive a desktop notification through your browser."
                toggled={isDesktopOn}
                onClick={(e) => toggleSettings(isDesktopOn, 'desktop')} />
            <Toggle
                label="Mobile"
                explanation="...receive a notification on your mobile phone."
                toggled={isMobileOn}
                onClick={(e) => toggleSettings(isMobileOn, 'mobile')} />
            <Toggle 
                label="Email"
                explanation="...receive an email."
                toggled={isEmailOn} 
                onClick={(e) => toggleSettings(isEmailOn, 'email')} />
            <RequestErrorModal message={'Attempt to update Notification Settings'} request={request} />
        </div>
    )

}

export default NotificationSetting
