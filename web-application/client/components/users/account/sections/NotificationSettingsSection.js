import React, { useState, useEffect }  from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { patchUser, cleanupRequest } from '/state/users'

import Toggle from '/components/generic/toggle/Toggle'

const NotificationSettingsSection = function({}) {

    const [requestId, setRequestId] = useState(null)
    const request = useSelector((state) => requestId in state.users.requests ? state.users.requests[requestId] : null)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const features = useSelector((state) => state.system.features)

    if ( ! ('1-notification-settings' in features) || features['1-notification-settings'].status !== 'enabled' ) {
        console.error(new Error(`Attempt to render NotificationSettingsSection without '1-notification-settings' enabled.`))
        return null
    }

    if ( ! currentUser ) {
        console.error(new Error(`Attempt to render NotificationSettingsSection without an authenticated user.`))
        return null
    }

    const dispatch = useDispatch()

    const toggleNotificationSetting = function(notification) {
        const settings = JSON.parse(JSON.stringify(currentUser.settings)) 

        settings.notifications[notification].email = ! settings.notifications[notification].email

        const userPatch = {
            id: currentUser.id,
            settings: settings
        }

        setRequestId(dispatch(patchUser(userPatch)))
    }

    useEffect(function() {
        if ( requestId ) {
            return function cleanup() {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId])
    
    return (
        <div className="user-settings__notification-settings">
            <h2>Notification Settings</h2>
            <div className="user-settings__notification-settings__section">
                <Toggle 
                    label="Post Comment"
                    explanation="Recieve an email notification when someone comments on one of your posts."
                    toggled={currentUser.settings.notifications['Post:comment:create'].email === true ? true : false} 
                    onClick={(e) => toggleNotificationSetting('Post:comment:create')} />
                <Toggle 
                    label="Friend Request Recieved"
                    explanation="Recieve an email notification when someone sends you a friend request."
                    toggled={currentUser.settings.notifications['User:friend:create'].email === true ? true : false} 
                    onClick={(e) => toggleNotificationSetting('User:friend:create')} />
                <Toggle 
                    label="Friend Request Accepted"
                    explanation="Recieve an email notification when someone accepts your friend request."
                    toggled={currentUser.settings.notifications['User:friend:update'].email === true ? true : false} 
                    onClick={(e) => toggleNotificationSetting('User:friend:update')} />
            </div>
        </div>
    )

}

export default NotificationSettingsSection
