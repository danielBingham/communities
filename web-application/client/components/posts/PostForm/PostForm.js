import { useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import logger from '/logger'

import can, { Actions, Entities } from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import { useGroup, useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { usePost } from '/lib/hooks/Post'

import { deleteFile } from '/state/File'
import { postPosts, patchPost } from '/state/Post'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import PostContent from './PostContent'
import SharedPostAttachment from './SharedPostAttachment'
import PostFileAttachment from './PostFileAttachment'
import PostLinkPreviewAttachment from './PostLinkPreviewAttachment'
import PostAttachmentControls from './PostAttachmentControls'
import PostVisibilityControl from './PostVisibilityControl'
import PostTypeControl from './PostTypeControl'

import ErrorModal from '/components/errors/ErrorModal'
import ErrorCard from '/components/errors/ErrorCard'


import './PostForm.css'

const PostForm = function({ postId, groupId, sharedPostId, origin }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [post, request] = usePost(postId) 
    const [context, groupRequests] = useGroupPermissionContext(currentUser, post !== null ? post.groupId : groupId)
    const group = context.group
    const currentMember = context.userMember

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    // TECHDEBT HACK: Using `group?.id` to prevent multiple requests from multiple calls
    // to `useGroup` and `useGroupMember`.
    const canCreateGroupPost = can(currentUser, Actions.create, Entities.GroupPost, context)

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()
    const [deleteFileRequest, makeDeleteFileRequest] = useRequest()

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const submit = function() {
        const newPost = {
            type: draft.type, 
            visibility: draft.visibility,
            userId: currentUser.id,
            fileId: draft.fileId,
            linkPreviewId: draft.linkPreviewId,
            sharedPostId: draft.sharedPostId,
            content: draft.content
        }

        if ( groupId ) {
            newPost.type = 'group'
            newPost.groupId = groupId
        }

        if ( ! postId ) {
            makePostRequest(postPosts(newPost))
        } else { 
            newPost.id = postId
            makePatchRequest(patchPost(newPost))
            
            if ( post.fileId !== newPost.fileId ) {
                makeDeleteFileRequest(deleteFile(post.fileId))
            }
        }
    }

    const cancel = function() {
        if ( draft.fileId !== null && post?.fileId !== draft.fileId ) {
            makeDeleteFileRequest(deleteFile(draft.fileId))
        }

        setDraft(null) 
        navigate(origin)
    }

    useEffect(function() {
        if (postRequest && postRequest.state == 'fulfilled') {
            setDraft(null)
            navigate(origin)
        }
    }, [ group, postRequest ])

    useEffect(function() {
        if (patchRequest && patchRequest.state == 'fulfilled') {
            setDraft(null) 
            if ( group ) {
                navigate(`/group/${group.slug}/${patchRequest.response.body.entity.id}`)
            } else {
                navigate(`/${currentUser.username}/${patchRequest.response.body.entity.id}`)
            }
        }
    }, [ patchRequest ])

    if ( request?.state === 'pending' || groupRequests.hasPending()) {
        return (  <Spinner /> )
    }

    // Don't show the form if they don't have permission to post in this Group.
    if ((groupId !== undefined && groupId !== null) || (post?.groupId !== undefined && post?.groupId !== null))
    {
        if ( group === undefined || currentMember === undefined ) {
            return (
                <Spinner />
            )
        } else if (currentMember !== undefined && canCreateGroupPost !== true) {
            logger.warn(`### PostForm:: No permission to post in Group.`)
            return (
                <ErrorCard href={`/group/${group.slug}`}><p>You don't have permission to post in { group.title }.</p></ErrorCard>
            )
        }
    }

    if ( postRequest && postRequest.state == 'failed' ) {
        errorView = (
            <ErrorModal><p>Something went wrong when creating your post:</p> <p>{ postRequest.error.message }</p></ErrorModal>
        )
    }

    return (
        <div className="post-form">
            <PostContent postId={postId} groupId={groupId} sharedPostId={sharedPostId} />
            <div className="attachments">
                <SharedPostAttachment postId={postId} groupId={groupId} sharedPostId={sharedPostId} />
                <PostLinkPreviewAttachment postId={postId} groupId={groupId} sharedPostId={sharedPostId} />
                <PostFileAttachment postId={postId} groupId={groupId} sharedPostId={sharedPostId} />
            </div>
            <div className="post-form__controls">
                <div className="post-form__controls__attachments">
                    <PostAttachmentControls postId={postId} groupId={groupId} sharedPostId={sharedPostId} />
                </div>
                <div className="post-form__controls__visibility">
                    <PostTypeControl postId={postId} groupId={groupId} sharedPostId={sharedPostId} />
                    <PostVisibilityControl postId={postId} groupId={groupId} sharedPostId={sharedPostId} />
                </div>
            </div>
            <div className="buttons">
                <Button onClick={(e) => cancel()}>Cancel</Button>
                <Button type="primary" onClick={(e) => submit()}>Post</Button>
            </div>
        </div>
    )
}

export default PostForm
