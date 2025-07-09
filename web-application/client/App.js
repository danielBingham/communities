import React, { useState, useEffect } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route
} from 'react-router-dom'

import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import logger from '/logger'

import { getConfiguration } from '/state/system'
import { getAuthentication } from '/state/authentication'

import MainLayout from '/layouts/MainLayout'
import HeaderlessLayout from '/layouts/HeaderlessLayout'
import AuthenticatedLayout from '/layouts/AuthenticatedLayout'

// Admin page for managing features.  Must be logged in and an admin to load it
// here.
import AdminPage from '/pages/admin/AdminPage'

import HomePage from '/pages/HomePage'
import Feed from '/components/feeds/Feed'

import AboutPage from '/pages/about/AboutPage'
import About from '/pages/about/views/About'
import FrequentlyAskedQuestions from '/pages/about/views/FrequentlyAskedQuestions'
import Roadmap from '/pages/about/views/Roadmap'
import Contribute from '/pages/about/views/Contribute'
import TermsOfServiceView from '/pages/about/views/TermsOfServiceView'
import Privacy from '/pages/about/views/Privacy'
import Contact from '/pages/about/views/Contact'

import LoginPage from '/pages/authentication/LoginPage'
import EmailConfirmationPage from '/pages/authentication/EmailConfirmationPage'
import ResetPasswordPage from '/pages/authentication/ResetPasswordPage'
import ResetPasswordRequestPage from '/pages/authentication/ResetPasswordRequestPage'
import AcceptInvitationPage from '/pages/authentication/AcceptInvitationPage'
import RegistrationPage from '/pages/authentication/RegistrationPage'
import AcceptTermsOfServicePage from '/pages/authentication/AcceptTermsOfServicePage'

import UserProfilePage from '/pages/users/UserProfilePage'

import UserAccountPage from '/pages/users/UserAccountPage'
import UserProfileEditForm from '/pages/users/views/UserProfileEditForm'
import ChangePasswordForm from '/pages/users/views/ChangePasswordForm'
import ChangeEmailForm from '/pages/users/views/ChangeEmailForm'
import ContributionView from '/pages/users/views/ContributionView'
import UserAccountSettingsView from '/pages/users/views/UserAccountSettingsView'

import FriendsPage from '/pages/friends/FriendsPage'
import YourFriendsList from '/pages/friends/views/YourFriendsList'
import FriendRequestsList from '/pages/friends/views/FriendRequestsList'
import FindFriends from '/pages/friends/views/FindFriends'

import GroupsPage from '/pages/groups/GroupsPage'
import YourGroups from '/pages/groups/views/YourGroups'
import CreateGroup from '/pages/groups/views/CreateGroup'
import FindGroups from '/pages/groups/views/FindGroups'

import GroupPage from '/pages/group/GroupPage'

import PostView from '/pages/posts/views/PostView'

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
 
    const [ configurationRequest, makeConfigurationRequest] = useRequest()
    const [authenticationRequest, makeAuthenticationRequest] = useRequest()

    // ======= Redux State ==========================================

    const configuration = useSelector((state) => state.system.configuration)

    // ======= Effect Handling ======================================

    useEffect(function() {
        makeConfigurationRequest(getConfiguration())
    }, [])

    // Note to self: These are system slice requests.  They go through
    // state/system and don't hit the API backend, instead they hit the root.
    useEffect(function() {
        if ( configurationRequest && configurationRequest.state == 'fulfilled') {
            if ( ! configuration.maintenance_mode ) {
                // Logger is a singleton, this will effect all other imports.
                logger.setLevel(configuration.log_level)
                makeAuthenticationRequest(getAuthentication())
            }
        } else if ( configurationRequest && configurationRequest.state == 'failed') {
            if ( retries < 5 ) {
                makeConfigurationRequest(getConfiguration())
                setRetries(retries+1)
            }
        }
    }, [ configurationRequest ])

    // ======= Render ===============================================

   if ( configuration?.maintenance_mode ) {
        return (
            <div className="maintenance-mode">
                <h1>Communities - Scheduled Maintenance</h1>
                <p>Communities is currently undergoing scheduled maintenance.  Please check back later.</p>
            </div>
        )
   }

    if ( ! configurationRequest || ! authenticationRequest ) {
        return (
            <Spinner />
        )
    } else if ( (configurationRequest && configurationRequest.state != 'fulfilled')
        || (authenticationRequest && authenticationRequest.state != 'fulfilled')
    ) {
        if (configurationRequest && configurationRequest.state == 'failed' && retries < 5) {
            return (<div className="error">Attempt to retrieve configuration from the backend failed, retrying...</div>)
        } else if (configurationRequest && configurationRequest.state == 'failed' && retries >= 5 ) {
            return (<div className="error">Failed to connect to the backend.  Try refreshing.</div>)
        } else if (authenticationRequest && authenticationRequest.state == 'failed' ) {
            return (<div className="error">Authentication request failed with error: {authenticationRequest.error}.</div>)
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
                <Routes>
                    { /* ========= Headerless pages ====================== */ }
                    { /* These pages are primarily used in various
                    authentication flows that don't allow breaking out of the
                    flow.  So they don't have a header. */ }
                    <Route element={ <HeaderlessLayout /> }>
                        <Route path="/email-confirmation" element={ <EmailConfirmationPage />} />
                        <Route path="/accept-invitation" element={ <AcceptInvitationPage /> } />
                        <Route path="/register" element={ <RegistrationPage /> } />
                        <Route path="/reset-password" element={ <ResetPasswordPage /> } />
                        <Route path="/accept-terms-of-service" element={ <AcceptTermsOfServicePage /> } />
                    </Route>

                    { /* ======== Pages with Headers ====================== */ }
                    <Route element={<MainLayout />}>

                        { /* ========== Authentication Controls =============== */ }
                        <Route path="/login" element={ <LoginPage /> } />
                        <Route path="/reset-password-request" element={ <ResetPasswordRequestPage /> } />
                        <Route path="/about" element={ <AboutPage /> } >
                            <Route path="faq" element={ <FrequentlyAskedQuestions /> } />
                            <Route path="roadmap" element={ <Roadmap /> } />
                            <Route path="contribute" element={ <Contribute /> } />
                            <Route path="tos" element={ <TermsOfServiceView /> } />
                            <Route path="privacy" element={ <Privacy /> } />
                            <Route path="contact" element={ <Contact /> } />
                            <Route index element={ <About />} />
                        </Route>

                        <Route element={<AuthenticatedLayout />}>

                            <Route path="/account" element={<UserAccountPage /> }>
                                <Route path="profile" element={ <UserProfileEditForm />  } />
                                <Route path="change-password" element={ <ChangePasswordForm /> } />
                                <Route path="change-email" element={ <ChangeEmailForm /> } />
                                <Route path="contribute" element={ <ContributionView /> } />
                                <Route path="settings" element={ <UserAccountSettingsView /> } />
                                <Route index element={ <UserProfileEditForm/> } />
                            </Route>

                            <Route path="/admin/*" element={ <AdminPage />} />

                            <Route path="/friends" element={ <FriendsPage />}>
                                <Route path="requests" element={ <FriendRequestsList />} />
                                <Route path="find" element={ <FindFriends /> } />
                                <Route index element={<YourFriendsList />} />
                            </Route>

                            <Route path="/groups" element={<GroupsPage />}>
                                <Route path="create" element={ <CreateGroup />} />
                                <Route path="find" element={ <FindGroups />} />
                                <Route index element={<YourGroups />} />
                            </Route> 

                            <Route path="/group/:slug/*" element={<GroupPage />} />

                            <Route path="/" element={ <HomePage /> }> 
                                <Route path="/f/:slug" element={ <Feed type="feed" /> } />
                                <Route path="/g/:slug" element={ <Feed type="group" /> } />
                                <Route index element={ <Feed type="feed" /> } />
                            </Route>

                            <Route path="/:slug" element={ <UserProfilePage /> }>
                                <Route path=":postId" element={ <PostView /> } />
                                <Route index element={ <Feed type="user" /> } />
                            </Route>

                        </Route>
                    </Route>
                </Routes>
            </Router>
        </ErrorBoundary>
    )
}

export default App
