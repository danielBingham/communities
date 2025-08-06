import React from 'react'
import { useSelector } from 'react-redux'

import NotificationSettingsSection from '/components/users/account/sections/NotificationSettingsSection'

import './UserAccountNotificationsView.css'

const UserAccountNotificationsView = function() {

    const features = useSelector((state) => state.system.features)

    const hasNotificationSettings = '1-notification-settings' in features && features['1-notification-settings'].status === 'enabled'

    return (
        <div className="user-notification-settings">
            { hasNotificationSettings && <NotificationSettingsSection />}
        </div>
    )

}

export default UserAccountNotificationsView

