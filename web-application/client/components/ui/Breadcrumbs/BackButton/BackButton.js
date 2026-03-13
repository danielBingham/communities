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

import { ArrowLeftIcon } from '@heroicons/react/24/solid'

import { pop } from '/state/history'

import './BackButton.css'

const BackButton = function() {

    const stack = useSelector((state) => state.history.stack)

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const goBack = function(event) {
        event.preventDefault()
        if ( stack.length > 0 ) {
            dispatch(pop())
            navigate(-1)
        }
    }

    if ( stack.length === 0 ) {
        return null
    }

    return (
        <a href="" className="back-button" onClick={goBack}><ArrowLeftIcon /> Back</a> 
    )

}

export default BackButton
