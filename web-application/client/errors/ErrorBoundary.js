/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import React from 'react'
import * as Sentry from "@sentry/react";

import logger from '/logger'

import CommunitiesLogo from '/components/header/CommunitiesLogo'

import './ErrorBoundary.css'

export default class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props)
        this.state = { 
            hasError: false,
            errorMessage: null
        }

    }
    // Update state so the next render will show the fallback UI.
    static getDerivedStateFromError(error) {        
        if ( error instanceof Error ) {
            console.error(error)
            return { 
                hasError: true,
                errorMessage: error.message
            }  
        } else {
            return {
                hasError: true,
                errorMessage: 'Unknown error occured.'
            }
        }
    }

    // Used for logging error information.  For now we're not going to use
    // this.
    componentDidCatch(error, errorInfo) {
        try {
            // If we're on the production environment, forward the error to Sentry.
            let environment = document.querySelector('meta[name="communities-environment"]').content
            if ( environment === 'production' ) {
                Sentry.captureException(error)
            }

            if ( 'stack' in error ) {
                logger.critical(error)
            } else {
                error.stack = errorInfo
                logger.critical(error)
            }
        } catch (logError) {
            try {
                logger.error(logError)
            } catch (secondLogError) {
                console.error(logError)
                console.error(secondLogError)
            }
        }
    }

    // Render the error UI.
    render() {

        // You can render any custom fallback UI
        if (this.state.hasError) {            
            return ( 
                <>
                    <header className="error-boundary"><CommunitiesLogo /> </header>
                    <main id="error-boundary">
                        <div className="error-boundary__card">
                            <h1>You found a Bug!</h1>
                            <p>Something went wrong.  This is definitely a bug.</p>
                            <p>The error has been recorded, but if you have time to file a bug report and provide details about what you were doing when this error occurred, that would really help us debug it!</p>
                            <p>Here are the ways you can report it:</p>
                            <ul>
                                <li>Post in <a href="/group/communities-feedback-and-discussion">Communities Feedback and Discussion</a></li>
                                <li><a href="mailto:contact@communities.social">Email us</a></li>
                                <li><a href="https://github.com/danielbingham/communities/issues">Open an issue</a> in the <a href="https://github.com/danielbingham/communities">Github Repository</a></li>
                            </ul>
                            <p>If you don't have time, we understand.  And we'll do our best to sort it out with the information already collected!</p>
                            <p className="error-boundary__buttons"><a className="error-boundary__button" href="/">Continue</a></p>

                        </div>
                    </main>
                </>
            )

        }

        return this.props.children
    }
}
