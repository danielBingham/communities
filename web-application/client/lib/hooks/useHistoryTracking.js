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

import { push } from '/state/history'

export const useHistoryTracking = function() {
    const location = useLocation()
    const previous = useSelector(
        (state) => state.history.stack.length > 0 ? state.history.stack[state.history.stack.length-1] : null,
        (a,b) => a?.key === b?.key
    ) 

    const lastBackPoint = useSelector(
        (state) => state.history.backPoints.length > 0 ? state.history.backPoints[state.history.backPoints.length-1] : null,
        (a,b) => a?.location.key === b?.location.key
    )

    const dispatch = useDispatch()
    
    // We only want this hook to fire when the location actually changes, not
    // when the stack changes (since this hook changes the stack itself).
    useEffect(() => {
        // We only add the current location to the history stack on unmount.
        // That way the last item on the stack will always be the previous
        // page.
        return () => {
            // We only want to add the current location to the stack if we didn't
            // just come back to it.
            if ( previous !== null && previous.key !== location.key ) {
                dispatch(push(location))
            }
        }
    }, [ location ])

    useEffect(() => {

        // If we've navigated away from the last backpoint
        if ( ! location.pathname.startsWith(lastBackPoint.path) ) {

        }

    }, [ location, lastBackPoint ])
}
