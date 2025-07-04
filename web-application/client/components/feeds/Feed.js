import React, { useEffect, useMemo }  from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/Group'

import PostList from '/components/posts/PostList'
import PostForm from '/components/posts/PostForm'

import Spinner from '/components/Spinner'

import './Feed.css'

const Feed = function({ type }) {
    const { slug } = useParams()

    const [request, makeRequest] = useRequest()

    const group = useSelector((state) => type == 'group' && slug in state.Group.bySlug ? state.Group.bySlug[slug] : null)

    useEffect(() => {
        if ( type == 'group' && ! group) {
            makeRequest(getGroups('Feed', { slug: slug }))
        } 
    }, [ type, slug, group ])

    const params = useMemo(() => {
        const params = {}
        if ( type == 'feed' ) {
            params.feed = slug || 'everything'
        } else if ( type == 'group') {
            if ( group ) {
                params.groupId = group.id 
            } 
        } else if ( type == 'user' ) {
            params.username = slug 
            params.type = 'feed'
        }
        return params
    }, [ type, slug, group ])

    if ( type == 'group' && ! group ) {
        return (
            <div className="feed">
                <Spinner />
            </div>
        )
    }


    return (
        <div className="feed">
            { type !== 'user' && <PostForm groupId={ group ? group.id : null } /> }
            <PostList name={`Feed:${type}`} params={ params } /> 
        </div>
    )

}

export default Feed
