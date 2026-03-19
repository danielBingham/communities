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
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { setBack, clearBack } from '/state/history'

export const useBackPoint = function(path) {
    const location = useLocation()
    const stack = useSelector((state) => state.history.stack) 

    const dispatch = useDispatch()
    useEffect(() => {
        const previous = stack.length > 0 ? stack[stack.length-1] : null
        if ( previous !== null && ! previous.pathname.startsWith(path)) {
            dispatch(setBack(previous))
        }

        return () => {
            // We don't want to clear the backpoint until we leave the current
            // path.
            if ( ! location.pathname.startsWith(path) ) {
                dispatch(clearBack())
            }
        }
    }, [path, location, stack])
}
