import logger from '/logger'

export const makeRequest = function(method, endpoint, body, onSuccess, onFailure) {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        let status = 0
        let responseOk = false

        const abortController = new AbortController()

        const fetchOptions = {
            method: method,
            signal: abortController.signal,
            headers: {
                'Accept': 'application/json',
            }
        }

        if ((method == 'POST' || method == 'PUT' || method == 'PATCH') && body ) {
            if ( body ) {
                if ( body instanceof FormData ) {
                    fetchOptions.body = body
                } else {
                    fetchOptions.body = JSON.stringify(body)
                    fetchOptions.headers['Content-Type'] = 'application/json'
                }
            }
        }

        if ( method !== 'GET' ) {
            if ( configuration && 'csrf' in configuration) {
                const csrfToken = configuration.csrf 
                fetchOptions.headers['X-Communities-CSRF-Token'] = csrfToken
            }
        }


        let host = document.querySelector('meta[name="communities-host"]').content
        let fullEndpoint = ''
        // System slice requests need to go to the root, rather than the API
        // backend.  These requests include querying for the configuration that
        // contains the API backend itself, as well as for feature flags.
        if ( endpoint === '/config' || endpoint === '/version') {
            fullEndpoint = host + endpoint
        } else if (configuration == null ) {
            // If we're querying from anything other than the system slice before
            // we've got our configuration, then we have an error.
            throw new Error('Attempting to query from the API before the configuration is set!')
        } else {
            fullEndpoint = host + configuration.backend + endpoint
        }

        const promise = fetch(fullEndpoint, fetchOptions).then(function(response) {
            status = response.status
          
            // If they've been logged out, send them to the home page, which will
            // let them log back in again.
            if ( status === 401 ) {
                window.location.href = "/"
            }

            responseOk = response.ok
            return response.json()
        }).then(function(responseBody) {
            const result = {
                request: {
                    endpoint: endpoint,
                    method: method
                },
                response: {
                    status:  status,
                    body: responseBody
                },
                error: null
            }

            if ( responseOk ) {
                if ( onSuccess ) {
                    try {
                        onSuccess(responseBody)
                        return result 
                    } catch (error) {
                        logger.error(`Error handling request success: `, error)
                        result.error = {
                            type: 'frontend-error',
                            message: `Failed to process response: ${error.message}.`
                        }
                        return Promise.reject(result)
                    }
                }
            } else {
                if ( 'error' in responseBody ) {
                    result.error = {
                        type: responseBody.error.type
                    }
                    
                    if ( 'all' in responseBody.error && Array.isArray(responseBody.error.all) ) {
                        result.error.all = responseBody.error.all
                    } else {
                        result.error.message = responseBody.error.message
                        result.error.all = [{
                            type: responseBody.error.type,
                            message: responseBody.error.message,
                            context: responseBody.error.context
                        }]
                    }
                }  else {
                    result.error = {
                        type: 'unknown'
                    }
                }

                // Invalid CSRF.  Refresh the page.
                if ( status === 452 )  {
                    window.location.reload()
                }

                if ( status >= 500 ) {
                    logger.error(`Request failed: `, result)
                } else {
                    logger.warn(`Request returned ${status}: `, result)
                }
                if ( onFailure ) {
                    try {
                        onFailure(status, responseBody)
                    } catch (error) {
                        logger.error(`Error handling request failure: `, error)
                    }
                } 
                return Promise.reject(result)
            }
        })

        return [ promise, abortController ]
    }
}
