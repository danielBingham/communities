import { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import logger from '/logger'

export function useRequest() {
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
               abortController.current.abort()
               abortController.current = null
           }
        }
    },[])

    return [ request, makeRequest, resetRequest ]
}
