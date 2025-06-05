import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getSiteModerations } from '/state/admin/siteModeration'

import PostCommentAwaitingAdminModeration from '/components/admin/moderation/PostCommentAwaitingAdminModeration'
import Post from '/components/posts/Post'
import PaginationControls from '/components/PaginationControls'

import './AdminModerationView.css'

const AdminModerationView = function({}) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ request, makeRequest ] = useRequest()

    const query = useSelector((state) => 'AdminModerationView' in state.siteModeration.queries ? state.siteModeration.queries['AdminModerationView']: null)
    const dictionary = useSelector((state) => state.siteModeration.dictionary)


    useEffect(function() {
        let page = searchParams.get('page')
        page = page || 1

        makeRequest(getSiteModerations('AdminModerationView', { status: 'flagged', page: page }))
    }, [])

    const moderationViews = []
    if ( query !== null ) {
        for(const moderationId of query.list) {
            const moderation = dictionary[moderationId]
            if ( moderation.status !== 'flagged' ) {
                continue
            }

            if ( moderation.postId !== null && moderation.postCommentId === null) {
                moderationViews.push(
                    <div key={moderation.id} className="moderation__post">
                        <Post id={moderation.postId} />
                    </div>
                )
            } else if ( moderation.postId !== null && moderation.postCommentId !== null ) {
                moderationViews.push(<PostCommentAwaitingAdminModeration id={moderation.id} />)
            }
        }
    }

    return (
        <div className="admin-moderation-view">
            <div className="admin-moderation-view__header">{ query?.meta.count } items to moderate</div>
            { moderationViews }
            <PaginationControls meta={query?.meta} />
        </div>
    )
}

export default AdminModerationView
