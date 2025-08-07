import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import Toggle from '/components/generic/toggle/Toggle'
import { RequestErrorModal } from '/components/errors/RequestError'

import './NotificationSetting.css'

const NotificationSetting = function({ label, explanation, notifications }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const notificationSettings = 'notifications' in currentUser.settings ? currentUser.settings.notifications : {}

    const toggleSettings = function(current, type) {
        const settings = JSON.parse(JSON.stringify(currentUser.settings)) 

        if ( ! ("notifications" in settings) ) {
            settings.notifications = {}
        }

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
            } else if ( type === 'silence' && current === true) {
                settings.notifications[notification].web = true
                settings.notifications[notification].email = true 
            } else {
                settings.notifications[notification][type] = ! current
            }
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

    const isSilenced = ! isWebOn && ! isEmailOn


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
                label="Email"
                explanation="...receive an email."
                toggled={isEmailOn} 
                onClick={(e) => toggleSettings(isEmailOn, 'email')} />
            <RequestErrorModal message={'Attempt to update Notification Settings'} request={request} />
        </div>
    )

}

export default NotificationSetting
