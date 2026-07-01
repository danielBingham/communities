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

/** Can we use local storage? **/
export const isLocalStorageAvailable = function() {
    try {
        if ( ! ('localStorage' in window) ) {
            return false
        }

        localStorage.setItem('__storage_test__', 'pending')
        localStorage.removeItem('__storage_test__')
        return true
    } catch (error) {
        logger.warn(`LocalStorage is not available: `, error)
        return false
    }
}
