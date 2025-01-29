import React from 'react'

import { Page, PageBody } from '/components/generic/Page'
import AcceptInvitationForm from '/components/authentication/AcceptInvitationForm'

import './AcceptInvitationPage.css'

const AcceptInvitationPage = function(props) {
    return (
        <Page id="accept-invitation-page">
            <PageBody>
                <div className="form-wrapper">
                    <AcceptInvitationForm />
                </div>
                <div className="overlay"></div>
            </PageBody>
        </Page>
    )

}

export default AcceptInvitationPage
