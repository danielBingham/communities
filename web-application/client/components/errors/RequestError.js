import React from 'react'

import logger from '/logger'

import ErrorModal from './ErrorModal'

const RequestError = function({ message, request }) {
    const contextMessage = message ? message : 'Request'

    if ( request && request.state === 'failed' ) {
        if ( request.response.status >= 500 && request.response.status < 600 ) {
            logger.error(`${ contextMessage }: `, request)
            return (
                <ErrorModal>
                    <p>{ contextMessage } failed with a server-error.</p>
                    <p>Status: { request.response.status}, Type: { request.error.type }</p>
                    <p>{ request.error.message }</p>
                </ErrorModal>
            )
        } else if ( request.response.status >= 400 && request.response.status < 500 ) {
            return (
                <ErrorModal>
                    <p>{ contextMessage } failed.</p>
                    <p>{ request.error.message }</p>
                </ErrorModal>
            )
        } else if ( request.error?.type === 'frontend-error' ) {
            return (
                <ErrorModal>
                    <p>{ contextMessage } succeeded, but we failed to process the response.</p>
                    <p>Refreshing your browser should clear this message.  Please report this as a bug.</p>
                    <p>{ request.error.message }</p>
                </ErrorModal>
            )
        } else {
            logger.error(`${ contextMessage }: `, request)
            return (
                <ErrorModal>
                    <p>{ contextMessage } failed for unknown reason.</p>
                    <p>Please report bug.</p>
                    <p>{ request.error?.message }</p>
                </ErrorModal>
            )
        }
    }

    return null
}

export default RequestError
