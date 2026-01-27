import React from 'react'

import ErrorModal from '/components/errors/ErrorModal'

import RequestErrorContent from './RequestErrorContent'

const RequestErrorModal = function({ message, request, ignore404, onContinue }) {

    if ( request && request.state === 'failed' ) {
        if ( ignore404 === true && request.response.status === 404 ) {
            return null
        }

        return (
            <ErrorModal onContinue={onContinue}>
                <RequestErrorContent message={message} request={request} ignore404={ignore404} />
            </ErrorModal>
        )
    }

    return null
}

export default RequestErrorModal
