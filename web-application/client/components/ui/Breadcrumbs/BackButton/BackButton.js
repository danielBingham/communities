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

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { Capacitor } from '@capacitor/core'

import { ArrowLeftIcon } from '@heroicons/react/24/solid'

import { pop } from '/state/history'

import Button from '/components/ui/Button'

import './BackButton.css'

const BackButton = function() {
    const previous = useSelector((state) => {
        const length = state.history.stack.length

        // If length is 0, we don't have anything on the stack yet. This is the
        // first render and there are no previous pages. 
        if ( length === 0  ) {
            return null
        } 

        // Otherwise, the last item on the stack is the previous page.
        else {
            return state.history.stack[length-1]
        }
    })
    const backLocation = useSelector((state) => {
        // If we have a back location, use that.
        if ( state.history.back !== null ) {
            return state.history.back
        } 

        // Otherwise, if we have a previous page, use that.
        else if ( state.history.stack.length > 0 ) {
            return state.history.stack[state.history.stack.length-1]
        } 

        // Otherwise, we don't have anywhere to go back to.
        else {
            return null
        }
    })

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const goBack = function(event) {
        event.preventDefault()

        // The initial page load will add the current location to the stack. So
        // there's only somewhere to go back to when the stack is at least 2. 
        if ( backLocation !== null ) {
            // If we're going right back to where we just were, then pop the
            // history stack.
            if ( previous !== null && previous.key === backLocation.key) { 
                dispatch(pop())
                navigate(-1)
            } else {
                // Otherwise navigate to the new back page.
                navigate(backLocation, { replace: true })
            }
        }
    }

    // Only render the back button on mobile.  On web, the user can use their
    // native back button.
    if ( Capacitor.getPlatform() !== 'ios' && Capacitor.getPlatform() !== 'android' ) {
        return null
    }

    if ( backLocation === null ) {
        return null
    }

    return (
        <Button className="back-button" onClick={goBack}><ArrowLeftIcon /> Back</Button> 
    )

}

export default BackButton
