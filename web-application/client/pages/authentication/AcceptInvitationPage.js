import React from 'react'

import AcceptInvitationForm from '/components/authentication/AcceptInvitationForm'

import CommunitiesLogo from '/components/header/CommunitiesLogo'

import './AcceptInvitationPage.css'

const AcceptInvitationPage = function(props) {
    return (
        <div id="accept-invitation-page">
            <div className="logo"><CommunitiesLogo /></div>
            <AcceptInvitationForm />
        </div>
    )

}

export default AcceptInvitationPage
