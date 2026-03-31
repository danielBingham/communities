import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { Badge } from '@capawesome/capacitor-badge'

import logger from '/logger'

/**
 * Check if we're running on a native mobile platform (ios or android).
 */
export function isNativePlatform() {
    const platform = Capacitor.getPlatform()
    return platform === 'ios' || platform === 'android'
}

/**
 * Remove a delivered push notification that matches the given Communities
 * notification ID.  Searches the delivered notifications on the device for one
 * whose `data.notificationId` matches, then removes it.
 *
 * @param {string} notificationId - The Communities database notification ID.
 */
export async function removeDeliveredNotificationById(notificationId) {
    if ( ! isNativePlatform() || ! notificationId ) {
        return
    }

    try {
        const delivered = await PushNotifications.getDeliveredNotifications()
        const matching = delivered.notifications.filter((n) => n.data?.notificationId === notificationId)

        if ( matching.length > 0 ) {
            await PushNotifications.removeDeliveredNotifications({ notifications: matching })

            const count = delivered.notifications.length - matching.length
            await Badge.set(count)
        }
    } catch (error) {
        logger.error(`Failed to remove delivered notification: `, error)
    }
}

/**
 * Remove all delivered push notifications from the notification center and
 * clear the app badge.
 */
export async function clearAllDeliveredNotifications() {
    if ( ! isNativePlatform() ) {
        return
    }

    try {
        await PushNotifications.removeAllDeliveredNotifications()
        await Badge.clear()
    } catch (error) {
        logger.error(`Failed to clear delivered notifications: `, error)
    }
}

/**
 * Update the app icon badge to reflect the number of delivered notifications
 * still in the notification center.
 */
export async function updateBadgeCount() {
    if ( ! isNativePlatform() ) {
        return
    }

    try {
        const delivered = await PushNotifications.getDeliveredNotifications()
        await Badge.set(delivered.notifications.length)
    } catch (error) {
        logger.error(`Failed to update badge count: `, error)
    }
}
