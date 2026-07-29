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
import { useState } from 'react'

import logger from '/logger'

import { isLocalStorageAvailable } from '/lib/localStorage'


const getLocalStorage = function(key, defaultValue) {
    if ( ! isLocalStorageAvailable() ) {
        return defaultValue
    }

    try {
        const text = localStorage.getItem(key)
        const value = JSON.parse(text)
        return value || defaultValue
    } catch (error) {
        logger.error(error)
        return defaultValue
    }
}

export const useLocalStorage = function(key, defaultValue) {
    const [ internalValue, setInternalValue] = useState(() => getLocalStorage(key, defaultValue))

    const setValue = (value) => {
        setInternalValue(value)

        try {
            if ( isLocalStorageAvailable() ) {
                if ( value === undefined || value === null || value === '' ) {
                    localStorage.removeItem(key)
                } else {
                    localStorage.setItem(key, JSON.stringify(value))
                }
            }
        } catch (error) {
            logger.error(error)
        }
    }

    return [internalValue, setValue]
}
