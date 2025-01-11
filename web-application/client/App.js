import React, { useState, useEffect } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import logger from '/logger'

import { getConfiguration, getFeatures, cleanupRequest as cleanupSystemRequest } from '/state/system'
import { getAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '/state/authentication'

// Admin page for managing features.  Must be logged in and an admin to load it
// here.
import AdminPage from '/pages/AdminPage'

import Header from '/components/header/Header'
import Footer from '/components/footer/Footer'
import NeedEmailConfirmationNotice from '/components/authentication/NeedEmailConfirmationNotice'

import HomePage from '/pages/HomePage'
import AboutPage from '/pages/AboutPage'
import TermsOfServicePage from '/pages/TermsOfServicePage'
import PrivacyPage from '/pages/PrivacyPage'

import RegistrationPage from '/pages/authentication/RegistrationPage'
import LoginPage from '/pages/authentication/LoginPage'
import EmailConfirmationPage from '/pages/authentication/EmailConfirmationPage'
import ResetPasswordPage from '/pages/authentication/ResetPasswordPage'
import ResetPasswordRequestPage from '/pages/authentication/ResetPasswordRequestPage'
import AcceptInvitationPage from '/pages/authentication/AcceptInvitationPage'

import UserProfilePage from '/pages/users/UserProfilePage'
import UserAccountPage from '/pages/users/UserAccountPage'

import FriendsPage from '/pages/friends/FriendsPage'

import PostPage from '/pages/posts/PostPage'

import ErrorBoundary from '/errors/ErrorBoundary'
import Spinner from '/components/Spinner'

import './app.css';


/**
 * App component acts as the root for the component tree, loading the layout
 * and all other components.
 */
const App = function(props) {
    const [ retries, setRetries ] = useState(0)

    // ======= Request Tracking =====================================
  
    const [configurationRequestId, setConfigurationRequestId] = useState(null)
    const configurationRequest = useSelector(function(state) {
        if ( ! configurationRequestId ) {
            return null
        } else {
            return state.system.requests[configurationRequestId]
        }
    })

    const [ featuresRequestId, setFeaturesRequestId] = useState(null)
    const featuresRequest = useSelector(function(state) {
        if ( featuresRequestId ) {
            return state.features.requests[featuresRequestId]
        } else {
            return null
        }
    })

    const [authenticationRequestId, setAuthenticationRequestId] = useState(null)
    const authenticationRequest = useSelector(function(state) {
        if ( ! authenticationRequestId ) {
            return null
        } else {
            return state.authentication.requests[authenticationRequestId]
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const configuration = useSelector(function(state) {
        return state.system.configuration
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    useEffect(function() {
        setConfigurationRequestId(dispatch(getConfiguration()))
    }, [])

    useEffect(function() {
        if ( configurationRequest && configurationRequest.state == 'fulfilled') {
            if ( ! configuration.maintenance_mode ) {
                // Logger is a singleton, this will effect all other imports.
                logger.setLevel(configuration.log_level)
                setFeaturesRequestId(dispatch(getFeatures()))
                setAuthenticationRequestId(dispatch(getAuthentication()))
            }
        } else if ( configurationRequest && configurationRequest.state == 'failed') {
            if ( retries < 5 ) {
                setConfigurationRequestId(dispatch(getConfiguration()))
                setRetries(retries+1)
            }
        }
    }, [ configurationRequest ])

    useEffect(function() {
        return function cleanup() {
            if ( configurationRequestId ) {
                dispatch(cleanupSystemRequest({ requestId: configurationRequestId }))
            }
        }
    }, [ configurationRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( authenticationRequestId ) {
                dispatch(cleanupAuthenticationRequest({ requestId: authenticationRequestId }))
            }
        }
    }, [ authenticationRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( featuresRequestId ) {
                dispatch(cleanupSystemRequest({ requestId: featuresRequestId }))
            }
        }
    }, [ featuresRequestId ])

    // ======= Render ===============================================

   if ( configuration?.maintenance_mode ) {
        return (
            <div className="maintenance-mode">
                <h1>Peer Review - Scheduled Maintenance</h1>
                <p>Peer Review is currently undergoing scheduled maintenance.  Please check back later.</p>
            </div>
        )
   }

    if ( ! configurationRequestId || ! authenticationRequestId || ! featuresRequestId) {
        return (
            <Spinner />
        )
    } else if ( (configurationRequest && configurationRequest.state != 'fulfilled')
        || (authenticationRequest && authenticationRequest.state != 'fulfilled')
        || (featuresRequest && featuresRequest.state != 'fulfilled')
    ) {
        if (configurationRequest && configurationRequest.state == 'failed' && retries < 5) {
            return (<div className="error">Attempt to retrieve configuration from the backend failed, retrying...</div>)
        } else if (configurationRequest && configurationRequest.state == 'failed' && retries >= 5 ) {
            return (<div className="error">Failed to connect to the backend.  Try refreshing.</div>)
        } else if (authenticationRequest && authenticationRequest.state == 'failed' ) {
            return (<div className="error">Authentication request failed with error: {authenticationRequest.error}.</div>)
        } else if ( featuresRequest && featuresRequest.state == 'failed' ) {
            return (<div className="error">Attempt to retrieve feature list failed with error: { featuresRequest.error}</div> )
        }

        return (
            <Spinner />
        )
    } 

    if ( configuration == null ) {
        return (<Spinner />)
    }

    // Once our requests have finished successfully, we can render the full
    // site.  We should only reach here when all of the requests have been
    // fulfilled.
    return (
        <ErrorBoundary>
            <Router>
                <Header />
                <main>
                    <Routes>
                        <Route path="/">
                            <Route path=":pageTab" element={ <HomePage /> } />
                            <Route index element={ <HomePage /> } />
                        </Route>
                        <Route path="/about" element={ <AboutPage />} />
                        <Route path="/tos" element={ <TermsOfServicePage /> } />
                        <Route path="/privacy" element={ <PrivacyPage /> } />
                        <Route path="/admin" element={ <AdminPage />} />

                        { /* ========== Authentication Controls =============== */ }
                        <Route path="/register" element={ <RegistrationPage /> } />
                        <Route path="/login" element={ <LoginPage /> } />
                        <Route path="/email-confirmation" element={ <EmailConfirmationPage />} />
                        <Route path="/reset-password" element={ <ResetPasswordPage /> } />
                        <Route path="/reset-password-request" element={ <ResetPasswordRequestPage /> } />
                        <Route path="/accept-invitation" element={ <AcceptInvitationPage /> } />

                        { /* ========== Users ================================= */ }
                        <Route path="/:name">
                            <Route path=":postId" element={ <PostPage /> } />
                            <Route index element={ <UserProfilePage /> } />
                        </Route>
                        <Route path="/account">
                            <Route path=":pageTab" element={ <UserAccountPage /> } />
                            <Route index element={ <UserAccountPage /> } />
                        </Route>

                        { /* ========== Friends ================================= */ }
                        <Route path="/friends">
                            <Route path=":pageTab" element={ <FriendsPage />} />
                            <Route index element={<FriendsPage />} />
                        </Route>
                            

                    </Routes>
                </main>
            </Router>
        </ErrorBoundary>
    )
}

export default App
