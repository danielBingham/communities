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
import logger from '/logger'

let hasLocalStorage = null

/** Can we use local storage? **/
export const isLocalStorageAvailable = function() {
    // If we've already checked localStorage for this load.
    if ( hasLocalStorage === true || hasLocalStorage === false) {
        return hasLocalStorage
    }

    try {
        if ( ! ('localStorage' in window) || window.localStorage === null ) {
            logger.warn(`'localStorage' not available.`)
            hasLocalStorage = false
            return hasLocalStorage
        }

        localStorage.setItem('__storage_test__', 'pending')
        localStorage.removeItem('__storage_test__')

        hasLocalStorage = true
        return hasLocalStorage
    } catch (error) {
        logger.warn(`'localStorage' not availabile: `, error)
        hasLocalStorage = false
        return hasLocalStorage
    }
}
