export const makeTrackedRequest = function(method, endpoint, body, onSuccess, onFailure) {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        let status = 0
        let responseOk = false

        const fetchOptions = {
            method: method,
            headers: {
                'Accept': 'application/json'
            }
        }
        if ((method == 'POST' || method == 'PUT' || method == 'PATCH') && body ) {
            if ( body instanceof FormData ) {
                fetchOptions.body = body
            } else {
                fetchOptions.body = JSON.stringify(body)
                fetchOptions.headers['Content-Type'] = 'application/json'
            }
        }

        let fullEndpoint = ''
        // System slice requests need to go to the root, rather than the API
        // backend.  These requests include querying for the configuration that
        // contains the API backend itself, as well as for feature flags.
        if ( endpoint == '/config') {
            fullEndpoint = endpoint
        } else if (configuration == null ) {
            // If we're querying from anything other than the system slice before
            // we've got our configuration, then we have an error.
            throw new Error('Attempting to query from the API before the configuration is set!')
        } else {
            fullEndpoint = configuration.backend + endpoint
        }

        return fetch(fullEndpoint, fetchOptions).then(function(response) {
            status = response.status
           
            // If they've been logged out, send them to the home page, which will
            // let them log back in again.
            if ( status === 401 ) {
                window.location.href = "/"
            }

            responseOk = response.ok
            return response.json()
        }).then(function(responseBody) {
            if ( responseOk ) {
                if ( onSuccess ) {
                    try {
                        onSuccess(responseBody)
                        return { status: status, body: responseBody }
                    } catch (error) {
                        return Promise.reject(error)
                    }
                }
            } else {
                if ( onFailure ) {
                    try {
                        onFailure(responseBody)
                        return { 
                            status: status, 
                            type: responseBody.error, 
                            message: responseBody.message, 
                            data: responseBody.data 
                        }
                    } catch (error) {
                        return Promise.reject(error)
                    }
                }
            }
        })
    }
}
