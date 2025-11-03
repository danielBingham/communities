import React, { useState, useEffect } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route
} from 'react-router-dom'

import { useSelector, useDispatch } from 'react-redux'

import migrateLocalStorage from '/migrations/StorageMigrations'

import { useRequest } from '/lib/hooks/useRequest'
import { useRetries } from '/lib/hooks/useRetries'
import { useSocket } from '/lib/hooks/useSocket'
import { useDevice } from '/lib/hooks/useDevice'

import logger from '/logger'

import { getInitialization } from '/state/system'
import { getAuthentication } from '/state/authentication'

import RootLayout from '/layouts/RootLayout'
import HeaderlessLayout from '/layouts/HeaderlessLayout'
import FooterlessLayout from '/layouts/FooterlessLayout'
import AuthenticatedLayout from '/layouts/AuthenticatedLayout'

// Admin page for managing features.  Must be logged in and an admin to load it
// here.
import AdminPage from '/pages/admin/AdminPage'

import HomePage from '/pages/HomePage'
import Feed from '/components/feeds/Feed'
import CreatePostPage from '/pages/posts/CreatePostPage'

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
import SetContributionPage from '/pages/authentication/SetContributionPage'
import AgeGate from '/pages/authentication/AgeGate'

import UserFriendsView from '/pages/users/views/UserFriendsView'
import UserProfilePage from '/pages/users/UserProfilePage'

import UserAccountPage from '/pages/users/UserAccountPage'
import UserProfileEditForm from '/pages/users/views/UserProfileEditForm'
import ChangePasswordForm from '/pages/users/views/ChangePasswordForm'
import ChangeEmailForm from '/pages/users/views/ChangeEmailForm'
import ContributionView from '/pages/users/views/ContributionView'
import UserAccountSettingsView from '/pages/users/views/UserAccountSettingsView'
import UserAccountPreferencesView from '/pages/users/views/UserAccountPreferencesView'
import UserAccountDangerZoneView from '/pages/users/views/UserAccountDangerZoneView'
import UserAccountNotificationsView from '/pages/users/views/UserAccountNotificationsView'

import FriendsPage from '/pages/friends/FriendsPage'
import YourFriendsList from '/pages/friends/views/YourFriendsList'
import FriendRequestsList from '/pages/friends/views/FriendRequestsList'
import FriendInvitationList from '/pages/friends/views/FriendInvitationList'
import FindFriends from '/pages/friends/views/FindFriends'
import InviteFriends from '/pages/friends/views/InviteFriends'

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
 
    const [getInitializationRequest, makeGetInitializationRequest] = useRequest()
    const [authenticationRequest, makeAuthenticationRequest] = useRequest()

    const configuration = useSelector((state) => state.system.configuration)

    // Note to self: These are system slice requests.  They go through
    // state/system and don't hit the API backend, instead they hit the root.
    useRetries('Initialize', function() {
        makeGetInitializationRequest(getInitialization())
    }, getInitializationRequest)

    useEffect(function() {
        if ( getInitializationRequest?.state == 'fulfilled') {
            logger.info(`System initialized...`)
            // Logger is a singleton, this will effect all other imports.
            logger.setLevel(configuration.log_level)

            logger.info(`Migrating local storage...`)
            migrateLocalStorage()

            makeAuthenticationRequest(getAuthentication())
        } 
    }, [ getInitializationRequest ])

    const isSocketConnected = useSocket()
    useDevice()

    // ======= Render ===============================================

    if ( ! getInitializationRequest || ! authenticationRequest ) {
        return (
            <Spinner />
        )
    } else if ( (getInitializationRequest && getInitializationRequest.state != 'fulfilled')
        || (authenticationRequest && authenticationRequest.state != 'fulfilled')
    ) {
        if (getInitializationRequest && getInitializationRequest.state == 'failed' && retries < 5) {
            return (<div className="error">Attempt to retrieve configuration from the backend failed, retrying...</div>)
        } else if (getInitializationRequest && getInitializationRequest.state == 'failed' && retries >= 5 ) {
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
                    <Route element={ <RootLayout /> }>
                        { /* These pages are primarily used in various
                        authentication flows that don't allow breaking out of the
                        flow.  So they don't have a header. */ }
                        <Route element={ <HeaderlessLayout /> }>
                            <Route path="/email-confirmation" element={ <EmailConfirmationPage />} />
                            <Route path="/accept-invitation" element={ <AcceptInvitationPage /> } />
                            <Route path="/reset-password" element={ <ResetPasswordPage /> } />
                            <Route path="/accept-terms-of-service" element={ <AcceptTermsOfServicePage /> } />
                            <Route path="/set-contribution" element={ <SetContributionPage /> } />
                            <Route path="/age-gate" element={ <AgeGate /> } />
                        </Route>

                        <Route element={<FooterlessLayout />}>
                            <Route path="/login" element={ <LoginPage /> } />
                            <Route path="/reset-password-request" element={ <ResetPasswordRequestPage /> } />
                            <Route path="/register" element={ <RegistrationPage /> } />

                            <Route path="/about" element={ <AboutPage /> } >
                                <Route path="faq" element={ <FrequentlyAskedQuestions /> } />
                                <Route path="roadmap" element={ <Roadmap /> } />
                                <Route path="contribute" element={ <Contribute /> } />
                                <Route path="tos" element={ <TermsOfServiceView /> } />
                                <Route path="privacy" element={ <Privacy /> } />
                                <Route path="contact" element={ <Contact /> } />
                                <Route index element={ <About />} />
                            </Route>
                        </Route>

                        <Route element={<AuthenticatedLayout />}>
                            <Route path="/account" element={<UserAccountPage /> }>
                                <Route path="profile" element={ <UserProfileEditForm />  } />
                                <Route path="change-password" element={ <ChangePasswordForm /> } />
                                <Route path="change-email" element={ <ChangeEmailForm /> } />
                                <Route path="contribute" element={ <ContributionView /> } />
                                <Route path="settings" element={ <UserAccountSettingsView /> } /> { /* deprecated */ }
                                <Route path="preferences" element={ <UserAccountPreferencesView /> } />
                                <Route path="danger-zone" element={ <UserAccountDangerZoneView/> } />
                                <Route path="notifications" element={ <UserAccountNotificationsView /> } />
                                <Route index element={ <UserProfileEditForm/> } />
                            </Route>

                            <Route path="/admin/*" element={ <AdminPage />} />

                            <Route path="/friends" element={ <FriendsPage />}>
                                <Route path="requests" element={ <FriendRequestsList />} />
                                <Route path="invited" element={ <FriendInvitationList />} />
                                <Route path="find" element={ <FindFriends /> } />
                                <Route path="invite" element={ <InviteFriends /> } />
                                <Route index element={<YourFriendsList />} />
                            </Route>

                            <Route path="/groups" element={<GroupsPage />}>
                                <Route path="create" element={ <CreateGroup />} />
                                <Route path="find" element={ <FindGroups />} />
                                <Route index element={<YourGroups />} />
                            </Route> 

                            <Route path="/group/:slug/*" element={<GroupPage />} />

                            <Route path="/create" element={<CreatePostPage />} />

                            <Route path="/" element={ <HomePage /> }> 
                                <Route path="/f/:slug" element={ <Feed type="feed" /> } />
                                <Route path="/g/:slug" element={ <Feed type="group" /> } />
                                <Route path="/p/:slug" element={ <Feed type="place" /> } />
                                <Route index element={ <Feed type="feed" /> } />
                            </Route>

                            <Route path="/:slug" element={ <UserProfilePage /> }>
                                <Route path="friends" element={ <UserFriendsView /> } />
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
