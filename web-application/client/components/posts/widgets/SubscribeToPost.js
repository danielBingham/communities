import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { BellAlertIcon, BellSlashIcon } from '@heroicons/react/24/outline'

import { postPostSubscriptions, deletePostSubscription, cleanupRequest } from '/state/postSubscriptions'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './SubscribeToPost.css'

const SubscribeToPost = function({ postId }) {

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector((state) => requestId in state.postSubscriptions.requests ? state.postSubscriptions.requests[requestId] : null)

    const subscription = useSelector((state) => postId in state.postSubscriptions.byPostId ? state.postSubscriptions.byPostId[postId] : null)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser ) {
        return null
    }

    const dispatch = useDispatch()

    const subscribe = function() {
        setRequestId(dispatch(postPostSubscriptions({ postId: postId, userId: currentUser.id })))
    }

    const unsubscribe = function() {
        setRequestId(dispatch(deletePostSubscription(postId)))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <>
            { ! subscription && <FloatingMenuItem onClick={subscribe} className="subscribe-to-post"><BellAlertIcon /> Subscribe</FloatingMenuItem> }
            { subscription && <FloatingMenuItem onClick={unsubscribe} className="unsubscribe-from-post"><BellSlashIcon /> Unsubscribe</FloatingMenuItem> }
        </>
    )

}

export default SubscribeToPost
