import React, { useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { BellAlertIcon, BellSlashIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { usePostSubscription } from '/lib/hooks/PostSubscription'

import { postPostSubscriptions, deletePostSubscription } from '/state/PostSubscription'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

import './SubscribeToPost.css'

const SubscribeToPost = function({ postId }) {

    const [request, makeRequest] = useRequest()

    const [subscription, subscriptionRequest, reset] = usePostSubscription(postId)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const closeMenu = useContext(CloseMenuContext)

    const subscribe = function() {
        makeRequest(postPostSubscriptions({ postId: postId, userId: currentUser.id }))
    }

    const unsubscribe = function() {
        makeRequest(deletePostSubscription(postId))
    }

    useEffect(() => {
        if ( request?.state === 'fulfilled' || request?.state === 'failed' ) {
            closeMenu()
        }
    }, [ request ])

    if ( ! currentUser ) {
        return null
    }

    return (
        <>
            { ( subscription === null || subscription === undefined )  && <DotsMenuItem onClick={subscribe} className="subscribe-to-post"><BellAlertIcon /> Subscribe</DotsMenuItem> }
            { ( subscription !== null && subscription !== undefined ) && <DotsMenuItem onClick={unsubscribe} className="unsubscribe-from-post"><BellSlashIcon /> Unsubscribe</DotsMenuItem> }
        </>
    )

}

export default SubscribeToPost
