import React from 'react'

import { Page, PageBody } from '/components/generic/Page'

import RegistrationForm from '/components/authentication/RegistrationForm'

import './RegistrationPage.css'

const RegistrationPage = function(props) {

    return (
        <Page id="registration-page">
            <PageBody>
                <RegistrationForm />
            </PageBody>
        </Page>
    )
}

export default RegistrationPage
