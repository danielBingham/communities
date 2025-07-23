import { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import logger from '/logger'

export function useRequest() {
    const [request, setRequest] = useState(null)
    const abortController = useRef(null)
    const dispatch = useDispatch()

    const makeRequest = function(reduxThunk) {
        if ( request !== null && abortController.current !== null ) {
            abortController.current.abort()
        }

        const request = {
            state: 'pending',
            request: null,
            response: null, 
            error: null,
        }
        setRequest(request)

        const [promise, controller] = dispatch(reduxThunk)
        abortController.current = controller
        promise
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

    // On unmount, cancel the request.
    useEffect(() => {
        return () => {
           if ( abortController.current !== null ) {
               abortController.current.abort()
           }
        }
    },[])

    return [ request, makeRequest, resetRequest ]
}
