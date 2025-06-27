import { useState } from 'react'
import { useDispatch } from 'react-redux'

import logger from '/logger'

export function useRequest() {
    const [request, setRequest] = useState(null)

    const dispatch = useDispatch()
    const makeRequest = function(reduxThunk) {
        const request = {
            state: 'pending',
            request: null,
            response: null, 
            error: null,
        }
        setRequest(request)

        dispatch(reduxThunk)
            .then((result) => {
                const newRequest = { 
                    state: 'fulfilled',
                    request: result.request,
                    response: result.response,
                    error: null
                }
                setRequest(newRequest)
            })
            .catch((result) => {
                const newRequest = { 
                    state: 'failed',
                    request: result.request,
                    response: result.response,
                    error: result.error
                }
                setRequest(newRequest)
            })
    }

    const resetRequest = function() {
        setRequest(null) 
    }

    return [ request, makeRequest, resetRequest ]
}
