import React, { useEffect } from 'react'

import { Page, PageBody } from '/components/generic/Page'

import './AboutPage.css'

const AboutPage = function(props) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [])

    return (
        <Page id="about-page">
            <PageBody>
            </PageBody>
        </Page>
    )

}

export default AboutPage
