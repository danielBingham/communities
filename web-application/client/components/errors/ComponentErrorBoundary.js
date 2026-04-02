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

import logger from '/logger'

import './ComponentErrorBoundary.css'

export default class ComponentErrorBoundary extends React.Component {

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
        try {
            if ( error !== undefined && error !== null && typeof error === 'object' && 'stack' in error ) {
                logger.error(error)
            } else if ( errorInfo !== undefined && errorInfo !== null && typeof errorInfo === 'object' && 'componentStack' in errorInfo ) {
                error.stack = errorInfo.componentStack
                logger.error(error)
            } else {
                logger.error(error)
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

    render() {
        if (this.state.hasError) {            
            return this.props.fallback 
        }

        return this.props.children
    }
}
