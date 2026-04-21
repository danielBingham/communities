/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Badge } from '@capawesome/capacitor-badge'

import logger from '/logger'

/**
 * Update the app icon badge to reflect the number of delivered notifications
 * still in the notification center.
 */
export async function updateBadgeCount(count) {
    try {
        // The badge count is only relevant to iOS.  Android handles badges
        // differently.
        if ( Capacitor.getPlatform() !== 'ios' ) {
            return
        }

        // Build 15 or version 0.15.0 of the app is required to use the Badge
        // plugin.
        const appInfo = await App.getInfo()
        if ( appInfo.build < 15 ) {
            return
        }

        await Badge.set({ count: count })
    } catch (error) {
        logger.error(`Failed to update badge count: `, error)
    }
}

/**
 * Clear the badge count entirely, setting it to zero.
 */
export async function clearBadgeCount() {
    try { 
        // The badge count is only relevant to iOS.  Android handles badges
        // differently.
        if ( Capacitor.getPlatform() !== 'ios' ) {
            return
        }

        // Build 15 or version 0.15.0 of the app is required to use the Badge
        // plugin.
        const appInfo = await App.getInfo()
        if ( appInfo.build < 15 ) {
            return
        }

        await Badge.clear()
    } catch (error) {
        logger.error(`Failed to clearBadgeCount: `, error)
    }
}
