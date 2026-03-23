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

import { pushBackPoint } from '/state/history'

export const useBackPoint = function(path) {
    const location = useLocation()
    const current = useSelector(
        (state) => state.history.stack.length > 0 ? state.history.stack[state.history.stack.length-1] : null,
        (a,b) => a?.key === b?.key
    )
    const previous = useSelector(
        (state) => state.history.stack.length > 1 ? state.history.stack[state.history.stack.length-2] : null,
        (a,b) => a?.key === b?.key
    ) 


    const dispatch = useDispatch()
    useEffect(() => {
        // If we haven't tracked the current location yet, then we can't make
        // good assumptions about the state of the history stack.  Bailout.
        if ( location?.key !== current?.key ) {
            return
        }

        if ( previous !== null && ! previous.pathname.startsWith(path)) {
            dispatch(pushBackPoint({ path: path, location: previous }))
        }

        // TODO TECHDEBT We never clean up the backpoint.  This is okay because
        // of that way we're currently using it -- it will get reset before
        // it's used against. But is a potential issue to fix in teh future.
    }, [path, previous, location, current ])
}
