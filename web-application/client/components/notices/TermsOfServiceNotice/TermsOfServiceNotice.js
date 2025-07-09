import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import TermsOfService from '/components/about/TermsOfService'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import Card from '/components/ui/Card'
import Button from '/components/generic/button/Button'

import './TermsOfServiceNotice.css'

const TermsOfServiceNotice = function({}) {
    const [ request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()

    const acceptTerms = function() {
        const notices = JSON.parse(JSON.stringify(currentUser.notices))

        notices.termsOfService = true

        const userPatch = {
            id: currentUser.id,
            notices: notices
        }

        makeRequest(patchUser(userPatch))
    }

    useEffect(function() {
        if ( ! currentUser || currentUser?.notices.termsOfService === true ) {
            navigate("/")
        }
    }, [ currentUser ])


    if ( ! currentUser ) {
        console.error(new Error(`Attempt to show TermsOfServiceNotice with no logged in user.`))
        return null
    }

    return (
        <div className="terms-of-service-notice">
            <div className="terms-of-service-notice__logo"><CommunitiesLogo /></div>
            <div className="terms-of-service-notice__instructions">
                <p>Before continuing, please read and accept our Terms of Service.
                You must accept the Terms to use the site.</p>
            </div>
            <Card className="terms-of-service-notice__terms-card">
                <TermsOfService />
            </Card>
            <div className="terms-of-service-notice__close">
                <Button type="primary" onClick={(e) => acceptTerms()}>Accept Terms of Service</Button>
            </div>
        </div>
    )
}

export default TermsOfServiceNotice
