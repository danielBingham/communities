import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

import logger from '/logger'

import { connect, disconnect } from '/state/socket'

export const useSocket = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser) 

    const isConnected = useSelector((state) => state.socket.isConnected)
    const inProgress = useSelector((state) => state.socket.inProgress)

    const [isActive, setIsActive] = useState(true)

    const retryTimeout = useRef(null)

    const [delay, setDelay] = useState(125)

    const dispatch = useDispatch()

    useEffect(function() {
        if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
            App.addListener('appStateChange', (event) => {
                setIsActive(event.isActive)
            })
        }

        return () => {
            if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
                App.removeAllListeners()
            }
        }
    }, [])

    useEffect(function() {
        if ( ! isActive ) {
            if ( isConnected || inProgress ) {
                dispatch(disconnect())
            }
        }
    }, [ isActive, isConnected, inProgress])

    useEffect(function() {
        if ( currentUser && ! isConnected && ! inProgress && isActive && retryTimeout.current === null) {
            retryTimeout.current = setTimeout(() => {
                dispatch(connect())
                retryTimeout.current = null
            }, delay)
            setDelay(delay * 1.25)

            return () => {
                if ( retryTimeout.current !== null ) {
                    clearTimeout(retryTimeout.current)
                }
                if ( isConnected || inProgress ) {
                    dispatch(disconnect())
                }
            }
        } else if ( isConnected ) {
            // Reset the delay once we've successfully connected.
            setDelay(125)
        }
    }, [ currentUser, isConnected, inProgress, isActive ])

    return isConnected
}
