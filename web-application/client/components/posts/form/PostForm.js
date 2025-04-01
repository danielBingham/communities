import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { LinkIcon } from '@heroicons/react/24/outline'
import { XCircleIcon, UsersIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import { useGroup } from '/lib/hooks/group'
import { usePost } from '/lib/hooks/post'

import { deleteFile } from '/state/files'
import { postPosts, patchPost, finishPostEdit, clearSharingPost } from '/state/posts'

import FileUploadInput from '/components/files/FileUploadInput'
import DraftImageFile from '/components/files/DraftImageFile'
import LinkForm from '/components/posts/form/controls/LinkForm'
import LinkPreview from '/components/links/view/LinkPreview'
import SharedPost from '/components/posts/SharedPost'
import Button from '/components/generic/button/Button'
import PostVisibilityControl from '/components/posts/form/controls/PostVisibilityControl'


import './PostForm.css'

const PostForm = function({ postId, groupId, sharedPostId }) {

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)
    const [draft, setDraft] = usePostDraft(postId, groupId)

    const [content,setContent] = useState( draft && 'content' in draft ? draft.content : '')
    const [fileId,setFileId] = useState(draft && 'fileId' in draft ? draft.fileId : null)
    const [linkPreviewId, setLinkPreviewId] = useState(draft && 'linkPreviewId' in draft ? draft.linkPreviewId : null)

    let defaultVisibility = 'private'
    if ( post !== null ) {
        defaultVisibility = post.visibility
    } else if ( group !== null && group.type === 'open' ) {
        defaultVisibility = 'public'
    }

    const [visibility, setVisibility] = useState(draft && 'visibility' in draft ? draft.visibility : defaultVisibility)

    const [showLinkForm, setShowLinkForm] = useState(false)

    const [error,setError] = useState('')

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()
    const [deleteFileRequest, makeDeleteFileRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const submit = function() {
        const newPost = {
            type: 'feed',
            visibility: visibility,
            userId: currentUser.id,
            fileId: fileId,
            linkPreviewId: linkPreviewId,
            sharedPostId: post ? post.sharedPostId : sharedPostId,
            content: content
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
            
            if ( post.fileId !== fileId ) {
                makeDeleteFileRequest(deleteFile(post.fileId))
            }

            dispatch(finishPostEdit(postId))
        }
    }

    const cancel = function() {
        setDraft(null) 

        setFileId(null)
        setLinkPreviewId(null)
        setContent('')
        setError('')

        if ( fileId !== null && post?.fileId !== fileId ) {
            makeDeleteFileRequest(deleteFile(fileId))
        }

        if ( postId ) {
            dispatch(finishPostEdit(postId))
        }
        if ( sharedPostId ) {
            dispatch(clearSharingPost())
        }
    }

    const onFileChange = function(fileId) {
        setFileId(fileId)
    }

    const onContentChange = function(event) {
        const newContent = event.target.value
        if ( newContent.length > 10000 ) {
            setError('overlength')
        } else {
            setError('')
            setContent(newContent)
        }
    }

    useEffect(function() {
        setContent(draft ? draft.content : '')
        setFileId(draft ? draft.fileId : null)
        setLinkPreviewId(draft ? draft.linkPreviewId : null)

        let defaultVisibility = 'private'
        if ( post !== null ) {
            defaultVisibility = post.visibility
        } else if ( group !== null && group.type === 'open' ) {
            defaultVisibility = 'public'
        }
        setVisibility(draft ? draft.visibility : defaultVisibility)
    }, [ postId, groupId ])

    useEffect(function() {
        setDraft({ content: content, fileId: fileId, linkPreviewId: linkPreviewId, visibility: visibility })
    }, [ postId, content, fileId, linkPreviewId, visibility ])

    useEffect(function() {
        if (postRequest && postRequest.state == 'fulfilled') {
            setDraft(null)
            dispatch(clearSharingPost())
            if ( group ) {
                navigate(`/group/${group.slug}/${postRequest.response.body.entity.id}`)
            } else {
                navigate(`/${currentUser.username}/${postRequest.response.body.entity.id}`)
            }
        }
    }, [ group, postRequest ])

    useEffect(function() {
        if (patchRequest && patchRequest.state == 'fulfilled') {
            setDraft(null) 
        }
    }, [ patchRequest ])

    let errorView = null
    if ( error == 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }

    let attachmentView = null
    let attachmentControlsView = null
    if ( ! fileId && ! linkPreviewId && ! showLinkForm && ! (sharedPostId || post?.sharedPostId)) {
        attachmentControlsView = (
            <div className="attachment-controls">
                <div className="image">
                    <FileUploadInput 
                        text="Add Image"
                        onChange={onFileChange} 
                        fileId={fileId} 
                        setFileId={setFileId} 
                        types={[ 'image/jpeg', 'image/png' ]} 
                    />
                </div>
                <div className="link">
                    <Button type="primary" onClick={(e) => {setShowLinkForm(true)}}><LinkIcon /><span className="attachment-button-text"> Add Link</span></Button>
                </div>
            </div>
        )
    } else if ( fileId ) {
        attachmentView = (
            <div className="attachment">
                <div className="attached">
                    <DraftImageFile fileId={fileId} setFileId={setFileId} width={650} deleteOnRemove={ ! post || post.fileId != fileId } />
                </div>
            </div>
        )
    } else if ( linkPreviewId ) {
        attachmentView = (
            <div className="link-preview">
                <a className="remove" href="" onClick={(e) => { e.preventDefault(); setLinkPreviewId(null) }}><XCircleIcon /></a>
                <LinkPreview id={linkPreviewId} />
            </div>
        )
    } else if ( showLinkForm ) {
        attachmentView = (
            <LinkForm setLinkPreviewId={setLinkPreviewId} setShowLinkForm={setShowLinkForm} />
        )

    } else if ( sharedPostId ) {
        attachmentView = (
            <SharedPost id={sharedPostId} />
        )
    } else if ( post && post.sharedPostId ) {
        attachmentView = (
            <SharedPost id={post.sharedPostId} />
        )
    }


    return (
        <div className="post-form">
            <textarea 
                onChange={onContentChange} 
                value={content}
                placeholder={group ? `Write your post in ${group.title}...` : "Write your post..." }
            >
            </textarea>
            { errorView }
            <div className="attachments">
                { attachmentView }
            </div>
            <div className="post-form__controls">
                <div className="post-form__controls__attachments">{ attachmentControlsView }</div>
                <div className="post-form__controls__visibility">
                    <PostVisibilityControl 
                        visibility={visibility} setVisibility={setVisibility} postId={postId} groupId={groupId} />
                </div>
            </div>
            <div className="buttons">
                <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                <Button type="primary" onClick={(e) => submit()}>Post</Button>
            </div>
        </div>
    )

}

export default PostForm
