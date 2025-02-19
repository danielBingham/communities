import { useState } from 'react'
import { useDispatch } from 'react-redux'

import logger from '/logger'

export function useRequest() {
    const [request, setRequest] = useState(null)

    const dispatch = useDispatch()
    const makeRequest = function(reduxThunk) {
        const request = {
            state: 'pending',
            response: null, 
            error: null,
        }
        setRequest(request)

        dispatch(reduxThunk)
            .then((response) => {
                const newRequest = { ...request }
                newRequest.state = 'fulfilled'
                newRequest.response = response 
                setRequest(newRequest)
            })
            .catch((error) => {
                logger.error(error)

                const newRequest = { ...request }
                newRequest.state = 'failed'
                newRequest.response = {
                    status: 'status' in error ? error.status : 500
                }
                newRequest.error = {
                    type: error.type ? error.type : 'unknown',
                    message: error.message ? error.message : '',
                    data: error.data ? error.data : {}
                }
                setRequest(newRequest)
            })
    }

    const resetRequest = function() {
        setRequest(null) 
    }

    return [ request, makeRequest, resetRequest ]
}
