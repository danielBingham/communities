import React  from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/users'

import Toggle from '/components/generic/toggle/Toggle'

const NotificationSettingsSection = function({}) {

    const [request, makeRequest] = useRequest()

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

    const toggleNotificationSetting = function(notification) {
        const settings = JSON.parse(JSON.stringify(currentUser.settings)) 

        if ( ! (notification in settings.notifications ) ) { 
            settings.notifications[notification] = {
                web: true,
                email: false,
                push: true
            }
        } else {
            settings.notifications[notification].email = ! settings.notifications[notification].email
        }

        const userPatch = {
            id: currentUser.id,
            settings: settings
        }

        makeRequest(patchUser(userPatch))
    }
   
    const notifications = currentUser.settings.notifications
    return (
        <div className="user-settings__notification-settings">
            <h2>Notification Settings</h2>
            <div className="user-settings__notification-settings__section">
                <Toggle 
                    label="Post Comment"
                    explanation="Recieve an email notification when someone comments on one of your posts."
                    toggled={ 'Post:comment:create' in notifications && notifications['Post:comment:create'].email === false ? false : true} 
                    onClick={(e) => toggleNotificationSetting('Post:comment:create')} />
                <Toggle 
                    label="Subscribed Post Comment"
                    explanation="Recieve an email notification when someone comments on a post you are subscribed to."
                    toggled={'Post:comment:create:subscriber' in notifications && notifications['Post:comment:create:subscriber'].email === false ? false : true} 
                    onClick={(e) => toggleNotificationSetting('Post:comment:create:subscriber')} />
                <Toggle 
                    label="Moderated Post"
                    explanation="Recieve an email notification when one of your posts is moderated."
                    toggled={'Post:moderation:rejected' in notifications && notifications['Post:moderation:rejected'].email === false ? false : true} 
                    onClick={(e) => toggleNotificationSetting('Post:moderation:rejected')} />
                <Toggle 
                    label="Friend Request Recieved"
                    explanation="Recieve an email notification when someone sends you a friend request."
                    toggled={'User:friend:create' in notifications && notifications['User:friend:create'].email === false ? false : true} 
                    onClick={(e) => toggleNotificationSetting('User:friend:create')} />
                <Toggle 
                    label="Friend Request Accepted"
                    explanation="Recieve an email notification when someone accepts your friend request."
                    toggled={'User:friend:update' in notifications && notifications['User:friend:update'].email === false ? false : true} 
                    onClick={(e) => toggleNotificationSetting('User:friend:update')} />
                <Toggle 
                    label="Group Invitations"
                    explanation="Recieve an email notification when someone invites you to a group."
                    toggled={ 'Group:member:create:invited' in notifications && notifications['Group:member:create:invited'].email === false ? false : true} 
                    onClick={(e) => toggleNotificationSetting('Group:member:create:invited')} />
            </div>
        </div>
    )

}

export default NotificationSettingsSection
