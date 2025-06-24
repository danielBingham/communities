import React from 'react'
import { useSelector } from 'react-redux'

import { BellAlertIcon, BellSlashIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { postPostSubscriptions, deletePostSubscription } from '/state/PostSubscription'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './SubscribeToPost.css'

const SubscribeToPost = function({ postId }) {

    const [subscribeRequest, makeSubscribeRequest] = useRequest()
    const [unsubscribeRequest, makeUnsubscribeRequest] = useRequest()

    const subscription = useSelector((state) => postId && postId in state.PostSubscription.byPostId ? state.PostSubscription.byPostId[postId] : null)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser ) {
        return null
    }

    const subscribe = function() {
        makeSubscribeRequest(postPostSubscriptions({ postId: postId, userId: currentUser.id }))
    }

    const unsubscribe = function() {
        makeUnsubscribeRequest(deletePostSubscription(postId))
    }

    return (
        <>
            { ! subscription && <FloatingMenuItem onClick={subscribe} className="subscribe-to-post"><BellAlertIcon /> Subscribe</FloatingMenuItem> }
            { subscription && <FloatingMenuItem onClick={unsubscribe} className="unsubscribe-from-post"><BellSlashIcon /> Unsubscribe</FloatingMenuItem> }
        </>
    )

}

export default SubscribeToPost
