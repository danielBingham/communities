import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { resetEntities } from '/state/lib'

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
    const groupId = searchParams.get('groupId')
    const sharedPostId = searchParams.get('sharedPostId')
    const origin = searchParams.get('origin')

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
