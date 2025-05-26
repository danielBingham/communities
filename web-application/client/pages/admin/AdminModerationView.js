import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getSiteModerations } from '/state/admin/siteModeration'

import Post from '/components/posts/Post'

const AdminModerationView = function({}) {

    const [ request, makeRequest ] = useRequest()

    const query = useSelector((state) => 'AdminModerationView' in state.siteModeration.queries ? state.siteModeration.queries['AdminModerationView']: null)
    const dictionary = useSelector((state) => state.siteModeration.dictionary)

    useEffect(function() {
        makeRequest(getSiteModerations('AdminModerationView', { status: 'flagged' }))
    }, [])

    const moderationViews = []
    if ( query !== null ) {
        for(const moderationId of query.list) {
            const moderation = dictionary[moderationId]
            if ( moderation.status !== 'flagged' ) {
                continue
            }

            if ( 'postId' in moderation && moderation.postId !== undefined && moderation.postId !== null ) {
                moderationViews.push(
                    <div key={moderation.postId} className="moderation">
                        <Post key={moderation.postId} id={moderation.postId} />
                    </div>
                )
            }
        }
    }

    return (
        <div className="admin-moderation-view">
            <div className="admin-moderation-header">{ query?.meta.count } items to moderate</div>
            { moderationViews }
        </div>
    )
}

export default AdminModerationView
