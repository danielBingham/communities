import React from 'react'

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
        console.error(error)
    }

    // Render the error UI.
    render() {

        // You can render any custom fallback UI
        if (this.state.hasError) {            
            return ( 
                <div id="error-boundary">
                    <h1>You found a Bug!</h1>
                    <p>
                        Something went wrong in a way that we couldn't
                        handle, or haven't handled yet.  This is definitely a
                    bug, please report it by emailing <a
                        href="mailto:contact@communities.social">contact@communities.social</a>.</p>
                    <p>We'll need as much information as you can give us.  What
                        were you doing before this happened?  What did you do
                    that triggered this?
                    </p>
                    <p>You'll find more information in your browser console.
                        You can get to it by right clicking on this page and
                        then selecting "Inspect" at the bottom of the menu.  It
                        should pop open a window with a bunch of tabs. The
                        "Elements" tab should be selected.  Choose the
                        "Console" tab. If there's anything in there, scroll
                        to the top, copy it and send it to us.  Also copy and
                    paste
                    the error message below.</p>
                    <div className="error-message"><span className="label">Error Message:</span> { this.state.errorMessage }</div>
                </div>
            )

        }

        return this.props.children
    }
}
