import React from 'react'

import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import RequestErrorContent from './RequestErrorContent'

const RequestErrorPage = function({ id, className, message, request }) {

    if ( request && request.state === 'failed' ) {
        return (
            <Page id={id} className={`${className ? className: ''}`}>
                <PageLeftGutter>
                </PageLeftGutter>
                <PageBody className='main'>
                    <RequestErrorContent message={message} request={request} />
                </PageBody>
                <PageRightGutter>
                </PageRightGutter>
            </Page>
        )
    }

    return null
}

export default RequestErrorPage
