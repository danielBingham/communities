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
import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

export function usePersistentRequest(key) {
    const [request, setRequest] = useState(null)
    const abortController = useRef(null)
    const dispatch = useDispatch()

    const makeRequest = function(reduxThunk) {
        if ( request?.state === 'pending' && abortController.current !== null ) {
            abortController.current.abort()
            abortController.current = null
        }
        
        setRequest({
            state: 'pending',
            request: null,
            response: null, 
            error: null,
        })

        const [promise, controller] = dispatch(reduxThunk)
        abortController.current = controller
        promise
            .then((result) => {
                setRequest({ 
                    state: result.success ? 'fulfilled' : 'failed',
                    request: result.request,
                    response: result.response,
                    error: result.error 
                })
            })
            .catch((error) => {
                logger.error(`Request error: `, error)
                setRequest({ 
                    state: 'failed',
                    request: {},
                    response: {},
                    error: {
                        type: 'unknown',
                        message: 'Unhandled request error.'
                    }
                })
            })
    }

    const resetRequest = function() {
        setRequest(null) 
    }

    // On unmount, cancel the request.
    useEffect(() => {
        return () => {
           if ( request?.state === 'pending' && abortController.current !== null ) {
               abortController.current.abort('Component unmounted.')
               abortController.current = null
           }
        }
    },[])

    return [ request, makeRequest, resetRequest ]
}
