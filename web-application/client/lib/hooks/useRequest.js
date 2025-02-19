import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

export function useRequest(debug) {
    if ( debug == 'useGroupFromSlug' ) {
        console.log(`----- useRequest(${debug}) -----`)
    }
    const [request, setRequest] = useState(null)
    if ( debug == 'useGroupFromSlug' ) {
        console.log(`useRequest(${debug}):: request:`)
        console.log(request)
    }

    const dispatch = useDispatch()
    const makeRequest = function(reduxThunk) {
        if ( debug == 'useGroupFromSlug') {
            console.log(`useRequest(${debug}):: makeRequest()`)
        }
        const request = {
            state: 'pending',
            response: null, 
            error: null,
        }
        setRequest(request)
        if ( debug == 'useGroupFromSlug') {
            console.log(`useRequest(${debug}):: makeRequest() -- Request Set`)
            console.log(request)
        }

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

    if ( debug == 'useGroupFromSlug' ) {
        console.log(`----- END useRequest(${debug}) -----`)
    }
    return [ request, makeRequest, resetRequest ]
}
