import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import logger from '/logger'

import { resetEntities } from '/state/lib'
import { usePost } from '/lib/hooks/Post'

import { Page, PageRightGutter, PageLeftGutter, PageBody } from '/components/generic/Page'
import PostForm from '/components/posts/PostForm'

const CreatePostPage = function() {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    const postId = searchParams.get('postId')
    let groupId = searchParams.get('groupId')
    let sharedPostId = searchParams.get('sharedPostId')
    const origin = searchParams.get('origin')

    const [post] = usePost(postId)

    logger.debug(`#### CreatePostPage:: post: `, post)
    if ( post ) {
        if ( post.groupId !== null ) {
            groupId = post.groupId
        }
        if ( post.sharedPostId !== null ) {
            sharedPostId = post.sharedPostId
        }
    }

    return (
        <Page id="create-post-page">
            <PageLeftGutter>
            </PageLeftGutter>
            <PageBody>
                <PostForm postId={postId} groupId={groupId} sharedPostId={sharedPostId} origin={origin} />
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default CreatePostPage
