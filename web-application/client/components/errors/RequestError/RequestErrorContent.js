import logger from '/logger'

import Error404 from '/components/errors/Error404'

const RequestErrorContent = function({ message, request, ignore404 }) {
    const contextMessage = message ? message : 'Request'

    if ( request && request.state === 'failed' ) {
        if ( ignore404 === true && request.response.status === 404 ) {
            return null
        }

        if ( request.response.status >= 500 && request.response.status < 600 ) {
            logger.error(`${ contextMessage }: `, request)
            return (
                <div className="server-error">
                    <p>{ contextMessage } failed with a server-error.</p>
                    <p>Status: { request.response.status}, Type: { request.error.type }</p>
                    <p>{ request.error.message }</p>
                </div>
            )
        } else if ( request.response.status >= 400 && request.response.status < 500 ) {
            if ( request.response.status === 404 ) {
                return ( <Error404 /> )
            } else {
                if ( 'all' in request.error ) {
                    const errorViews = []
                    for(const error of request.error.all) {
                        errorViews.push(
                            <div className="user-error">
                                <p>{ error.message }</p>
                            </div>
                        )
                    }
                    return (
                        <div className="user-errors">
                            <p>{ contextMessage } failed.</p>
                            { errorViews }
                        </div>
                    )
                } else {
                    return (
                        <div className="user-error">
                            <p>{ contextMessage } failed.</p>
                            <p>{ request.error.message }</p>
                        </div>
                    )
                }
            }
        } else if ( request.error?.type === 'frontend-error' ) {
            return (
                <div className="frontend-error">
                    <p>{ contextMessage } succeeded, but we failed to process the response.</p>
                    <p>Refreshing your browser should clear this message.  Please report this as a bug.</p>
                    <p>{ request.error.message }</p>
                </div>
            )
        } else {
            logger.error(`${ contextMessage }: `, request)
            return (
                <div className="request-error">
                    <p>{ contextMessage } failed for unknown reason.</p>
                    <p>Please report bug.</p>
                    <p>{ request.error?.message }</p>
                </div>
            )
        }
    }

    return null
}

export default RequestErrorContent
