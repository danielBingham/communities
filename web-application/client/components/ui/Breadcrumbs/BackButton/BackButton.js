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

import { goToLastBackPoint } from '/state/history'

import Button from '/components/ui/Button'

import './BackButton.css'

const BackButton = function() {

    const backLocation = useSelector((state) => {
        // If we have a back location, use that.
        if ( state.history.backPoints.length > 0) {
            return state.history.backPoints[state.history.backPoints.length-1].location
        } 

        // Otherwise, we don't have anywhere to go back to.
        else {
            return null
        }
    },
    (a,b) => a?.key === b?.key)

    console.log(`backLocation: `, backLocation)

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const goBack = function(event) {
        event.preventDefault()

        if ( backLocation !== null ) {
            console.log(`\n\nGO BACK :: `,
                `backLocation: `, backLocation, '\n\n')
            dispatch(goToLastBackPoint())
            navigate(backLocation, { replace: true })
        }
    }

    // Only render the back button on mobile.  On web, the user can use their
    // native back button.
    /*if ( Capacitor.getPlatform() === 'web' ) {
        return null
    }*/

    if ( backLocation === null ) {
        return null
    }

    return (
        <Button className="back-button" onClick={goBack}><ArrowLeftIcon /> Back</Button> 
    )

}

export default BackButton
