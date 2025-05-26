import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { postSiteModeration } from '/state/admin/siteModeration'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import AreYouSure from '/components/AreYouSure'

import './FlagPost.css'

const FlagPost = function({ postId } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [request, makeRequest] = useRequest()

    const executeFlag = function() {
        setAreYouSure(false)
        makeRequest(postSiteModeration({ userId: currentUser.id, status: 'flagged', postId: postId }))
    }

    if ( ! currentUser ) {
        return null
    }

    return (
        <>
            <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="flag-post"><FlagIcon /> flag</FloatingMenuItem>
            <AreYouSure className="flag-post" isVisible={areYouSure} execute={executeFlag} cancel={() => setAreYouSure(false)}> 
                <p><strong>Are you sure you want to flag this post?</strong></p>
                <div className="flag-post__explanation">
                    <p>
                        Flagging is intended for content that needs to be urgently
                        removed from the site. Content appropriate to flag:
                    </p>
                    <ul>
                        <li>Direct incitement to violence against an individual or group of people.</li>
                        <li>Explicit hate.</li>
                        <li>Direct harrassment.</li>
                        <li>Other forms of content that can cause immediate, direct harm.</li>
                    </ul>
                    <p>
                        If you think it should be moderated but it doesn't rise to
                        the level of "needing urgent response" because it could
                        cause "immediate, direct harm", then please 'demote' it
                        instead.
                    </p>
                </div>
            </AreYouSure>
        </>
    )
}

export default FlagPost 
