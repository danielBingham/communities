import React from 'react'

import RegistrationForm from '/components/authentication/RegistrationForm'

import CommunitiesLogo from '/components/header/CommunitiesLogo'

import './RegistrationPage.css'

const RegistrationPage = function(props) {
    return (
        <div id="registration-page">
            <div className="logo"><CommunitiesLogo alwaysFull={true} /></div>
            <RegistrationForm />
        </div>
    )

}

export default RegistrationPage
