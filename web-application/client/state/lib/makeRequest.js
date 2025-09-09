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
import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

import logger from '/logger'


export const makeRequest = function(method, endpoint, body, onSuccess, onFailure) {
    return function(dispatch, getState) {

        const system = getState().system
        const abortController = new AbortController()

        const request = async function() {

            // ==================== Assemble the Request ======================
            //
            
            const fetchOptions = {
                method: method,
                signal: abortController.signal,
                headers: {
                    'Accept': 'application/json',
                    'X-Communities-Platform': Capacitor.getPlatform()
                },
            }

            // Make sure we handle the body appropriately. If it isn't a
            // FormData instance, then fallback to JSON.
            if ((method == 'POST' || method == 'PATCH') && body ) {
                if ( body instanceof FormData ) {
                    fetchOptions.body = body
                } else {
                    fetchOptions.body = JSON.stringify(body)
                    fetchOptions.headers['Content-Type'] = 'application/json'
                }
            }

            // Send the CSRF token unless this is a GET request or we don't have it.
            if ( method !== 'GET' && system.csrf !== null ) {
                fetchOptions.headers['X-Communities-CSRF-Token'] = system.csrf 
            }

            // For Android and IOS we need to do Token authentication, since
            // Cookies don't work in native apps or through Capacitor.
            if ( Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios' ) {
                let authToken = null
                try { 
                    authToken = await SecureStoragePlugin.get({ key: 'auth-token' })
                } catch (error) {
                    logger.warn(`Missing auth token.  Will make an unauthenticated request.`)
                }

                if ( authToken !== null && authToken !== undefined ) {
                    fetchOptions.headers['X-Communities-Auth'] = authToken
                }
            }

            let apiUrl = new URL(system.api, system.host).href
            let fullEndpoint = new URL(endpoint, apiUrl).href 

            // ==================== Make the Request ==========================
            //
            
            const response = await fetch(fullEndpoint, fetchOptions)

            // If they've been logged out, send them to the home page, which will
            // let them log back in again.
            if ( response.status === 401 ) {
                window.location.href = "/"
            }

            // For Android and IOS we need to check the request header for an
            // authentication token and save it in secure storage if we find
            // one. This is the Session ID.  
            if ( Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios' ) {
                if ( response.headers.has('X-Communities-Auth') ) {
                    await SecureStoragePlugin.set({ key: 'auth-token', value: response.headers.get('X-Communities-Auth') })
                }
            }
            
            const responseBody = await response.json()

            const result = {
                success: response.ok,
                request: {
                    endpoint: endpoint,
                    method: method
                },
                response: {
                    status:  response.status,
                    body: responseBody
                },
                error: null
            }

            if ( ! response.ok ) {
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
                if ( response.status === 452 )  {
                    window.location.reload()
                }

                if ( response.status >= 500 ) {
                    logger.error(`Request failed: `, result)
                } else {
                    logger.warn(`Request returned ${response.status}: `, result)
                }
                if ( onFailure ) {
                    try {
                        onFailure(response.status, responseBody)
                    } catch (error) {
                        logger.error(`Error handling request failure: `, error)
                    }
                } 
                return result
            }

            if ( onSuccess ) {
                try {
                    onSuccess(responseBody)
                } catch (error) {
                    logger.error(`Error handling request success: `, error)
                    result.success = false
                    result.error = {
                        type: 'frontend-error',
                        message: `Failed to process response: ${error.message}.`
                    }
                    return result
                }
            }

            return result 
        }

        const promise = request()
        return [promise, abortController]
    }
}
