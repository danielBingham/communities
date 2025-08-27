import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { subscribe, unsubscribe } from '/state/events'

export const useEventSubscription = function(entity, action, context) {

    const isConnected = useSelector((state) => state.socket.isConnected)

    const dispatch = useDispatch()
    useEffect(function() {
        dispatch(subscribe({ entity: entity, action: action, context: context }))

        return () => {
            dispatch(unsubscribe({ entity: entity, action: action, context: context }))
        }
    }, [])

    useEffect(function() {
        dispatch(subscribe({ entity: entity, action: action, context: context }))
    }, [ isConnected])
}
