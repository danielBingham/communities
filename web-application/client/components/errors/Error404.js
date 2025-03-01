import React from 'react'

import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './Error404.css'

const Error404 = function() {

    return (
        <Page id="error-404">
            <PageLeftGutter></PageLeftGutter>
            <PageBody>
                <div className="error-404__error">
                    <h1>404 Error: Not Found</h1>
                    <p>We couldn't find what you were looking for.  Either it doesn't exist or you don't have permission to see it.</p>
                    <p>If you believe we are in error and this is a bug, please reach out to <a href="mailto:contact@communities.social">contact@communities.social</a> and let us know what happened!</p>
                </div>
            </PageBody>
            <PageRightGutter></PageRightGutter>
        </Page>
    )
}

export default Error404
