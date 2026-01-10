import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { subscribe, unsubscribe } from '/state/events'

export const useEventSubscription = function(entity, action, context, options) {

    const isConnected = useSelector((state) => state.socket.isConnected)

    const dispatch = useDispatch()
    useEffect(function() {
        console.log(`== useEventSubscription(${entity}, ${action}):: `,
            `\ncontext: `, context,
            `\noptions: `, options)
        // Ignore this subscription when skip is `true`
        if ( options?.skip === true ) {
            return
        }

        dispatch(subscribe({ entity: entity, action: action, context: context }))

        return () => {
            if ( options?.skip === true ) {
                return
            }

            dispatch(unsubscribe({ entity: entity, action: action, context: context }))
        }
    }, [ options?.skip ])

    useEffect(function() {
        if ( options?.skip === true ) {
            return
        }

        dispatch(subscribe({ entity: entity, action: action, context: context }))
    }, [ isConnected, options?.skip ])
}
