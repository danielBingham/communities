import React, { useEffect }  from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

import PostList from '/components/posts/list/PostList'
import PostForm from '/components/posts/form/PostForm'

import Spinner from '/components/Spinner'

import './Feed.css'

const Feed = function({ type }) {

    const { slug } = useParams()

    const [request, makeRequest] = useRequest()

    const group = useSelector((state) => type == 'group' && slug in state.groups.bySlug ? state.groups.bySlug[slug] : null)

    useEffect(() => {
        if ( type == 'group') {
            makeRequest(getGroups('Feed', { slug: slug }))
        }
    }, [ type, slug ])


    if ( type == 'group' && ! group) {
        return (
            <div className="feed">
                <Spinner />
            </div>
        )
    }

    const params = {}
    if ( type == 'feed' ) {
        if ( slug == 'friends' ) {
            params.feed = 'friends'
        }
    } else if ( type == 'group') {
        if ( group ) {
            params.groupId = group.id 
        }
    }

    return (
        <div className="feed">
            <PostForm groupId={ group ? group.id : null } />
            <PostList name={`Feed:${type}`} params={ params } /> 
        </div>
    )

}

export default Feed
