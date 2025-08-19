import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connect, disconnect } from '/state/socket'

export const useSocket = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser) 
    const isConnected = useSelector((state) => state.socket.isConnected)
    const inProgress = useSelector((state) => state.socket.inProgress)

    const retryTimeout = useRef(null)

    const [delay, setDelay] = useState(125)

    const dispatch = useDispatch()
    useEffect(function() {
        if ( currentUser && ! isConnected && ! inProgress && retryTimeout.current === null) {
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
        }
    }, [ currentUser, isConnected, inProgress ])

    return isConnected
}
