import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { patchUser, cleanupRequest } from '/state/users'

import Button from '/components/generic/button/Button'
import Modal from '/components/generic/modal/Modal'

import './WelcomeNotice.css'

const WelcomeNotice = function({}) {
    const [isVisible, setIsVisible] = useState(true)

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector((state) => "requestId" in state.users.requests ? state.users.requests[requestId] : null)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    
    if ( ! currentUser ) {
        console.error(new Error(`Attempt to show WelcomeNotice with no logged in user.`))
        return null
    }

    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! isVisible ) {
            const notices = JSON.parse(JSON.stringify(currentUser.notices))

            notices.welcomeNotice = true

            const userPatch = {
                id: currentUser.id,
                notices: notices
            }

            setRequestId(dispatch(patchUser(userPatch)))
        }
    }, [ isVisible ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible}>
            <div className="welcome-notice">
                <h1>Welcome to Communities!</h1>
                <p>Communities is non-profit social media in private beta.</p>
                <p>We're working to help people build community, connect, and
                    organize.</p>
                <p>Communities is a new model of software platform. It's funded
                    voluntarily by its users and will eventually become a multi-stakeholder
                    cooperative: democratically governed by its workers and
                users in collaboration.</p>
                <p>All users are asked to <Link
                to="/account/contribute">contribute</Link> to the platform's
                    development and maintenance if they can.  The request is $10 /
                    month, but it's a sliding scale and if you can't contribute
                    that's fine. You're still welcome to use the platform.</p>
                <p><strong>We're currently in early private beta.</strong></p>
                <p>If you're not familiar with the software development lifecycle,
                    early beta means we're just starting to test out the platform.
                    We've built the absolute minimum number of features necessary
                    for the platform to be useful and we're beginning to let people
                    try it out.</p>  
                <p>The platform isn't stable yet. There <em>will</em> be bugs.  We can't promise those bugs won't
                    result in data loss (IE losing some posts).  We'll do our best
                    to prevent it, but by joining the beta you agree to use the
                    platform at your own risk.</p>
                <p>If you'd rather not, we totally understand, feel free to <Link to="/account/settings">delete your account</Link> and come
                    back once the platform is stable!</p>
                <p>Otherwise, take a look at our <Link to="/about/tos">Terms</Link> and <Link to="/about/privacy">Privacy Policy</Link> and dive in!</p>
                <div className="welcome-notice__close"><Button type="primary" onClick={(e) => setIsVisible(false)}>Get Started</Button></div>
            </div>
        </Modal>


    )
}

export default WelcomeNotice
