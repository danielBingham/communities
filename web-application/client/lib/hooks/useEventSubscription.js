import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { subscribe, unsubscribe } from '/state/events'

// Key tells the subscriber when we need to update the subscription because the
// context changed. Often the identifiers for the entity being subscribed are
// buried in the context and the hook doesn't know which values are
// important.  
//
// The hook's caller needs to use the key to construct a unique string for
// each subscription incorporating things like entity, action, and the set of
// unique identifiers for the entity in question.
export const useEventSubscription = function(key, entity, action, context, options) {

    const isConnected = useSelector((state) => state.socket.isConnected)

    const dispatch = useDispatch()
    useEffect(function() {
        if ( key === undefined || key === null ) {
            return
        }

        dispatch(subscribe({ entity: entity, action: action, context: context }))

        return () => {
            if ( key === undefined || key === null) {
                return
            }

            dispatch(unsubscribe({ entity: entity, action: action, context: context }))
        }
    }, [ key ])

    useEffect(function() {
        if ( key === undefined || key === null ) {
            return
        }

        dispatch(subscribe({ entity: entity, action: action, context: context }))
    }, [ isConnected ])
}
