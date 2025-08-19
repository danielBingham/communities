import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'

import { connect, disconnect } from '/state/socket'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'

const AuthenticatedLayout = function() {

    const currentUser = useAuthentication() 
    const isConnected = useSelector((state) => state.socket.isConnected)

    const dispatch = useDispatch()
    useEffect(function() {
        if ( currentUser && ! isConnected ) {
            console.log(`Triggering connect: `)
            console.log(currentUser)
            dispatch(connect())

            return () => {
                dispatch(disconnect())
            }
        }
    }, [ currentUser ])

    if ( ! currentUser ) {
        return (
            <WelcomeSplash />
        )
    }

    if ( ! isConnected ) {
        return (<div>Awaiting connection...</div>)
    }

    return (
        <div className="authenticated">
            <Outlet />
        </div>
    )
}

export default AuthenticatedLayout

