import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { LinkIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteFile } from '/state/files'
import { postPosts, patchPost, finishPostEdit } from '/state/posts'

import FileUploadInput from '/components/files/FileUploadInput'
import DraftImageFile from '/components/files/DraftImageFile'
import LinkForm from '/components/posts/form/controls/LinkForm'
import LinkPreview from '/components/links/view/LinkPreview'
import Button from '/components/generic/button/Button'

import './PostForm.css'

const PostForm = function({ postId }) {

    const [content,setContent] = useState('')
    const [fileId,setFileId] = useState(null)
    const [linkPreviewId, setLinkPreviewId] = useState(null)

    const [showLinkForm, setShowLinkForm] = useState(false)

    const [error,setError] = useState('')

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()
    const [deleteFileRequest, makeDeleteFileRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.posts.dictionary ? state.posts.dictionary[postId] : null)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const getDraftKey = function() {
        if ( postId ) {
            return `draft.${postId}`
        } else {
            return `draft`
        }
    }

    const submit = function() {
        const newPost = {
            userId: currentUser.id,
            fileId: fileId,
            linkPreviewId: linkPreviewId,
            content: content
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
        localStorage.removeItem(getDraftKey())

        setFileId(null)
        setLinkPreviewId(null)
        setContent('')
        setError('')

        if ( ! post || ( fileId !== null && post.fileId !== fileId )) {
            makeDeleteFileRequest(deleteFile(fileId))
        }

        if ( postId ) {
            dispatch(finishPostEdit(postId))
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
        let draft = {
            content: post ? post.content : '',
            fileId: post ? post.fileId : null,
            linkPreviewId: post ? post.linkPreviewId : null
        }

        const existingDraft = JSON.parse(localStorage.getItem(getDraftKey()))

        if ( existingDraft ) {
            draft = existingDraft
        } else {
            localStorage.setItem(getDraftKey(), JSON.stringify(draft))
        }

        setContent(draft.content)
        setFileId(draft.fileId)
        setLinkPreviewId(draft.linkPreviewId)
    }, [ postId ])

    useEffect(function() {
        localStorage.setItem(getDraftKey(), JSON.stringify({ content: content, fileId: fileId, linkPreviewId: linkPreviewId }))
    }, [ postId, content, fileId, linkPreviewId ])

    useEffect(function() {
        if (postRequest && postRequest.state == 'fulfilled') {
            localStorage.removeItem(getDraftKey())
            navigate(`/${currentUser.username}/${postRequest.response.body.entity.id}`)
        }
    }, [ postRequest ])

    useEffect(function() {
        if (patchRequest && patchRequest.state == 'fulfilled') {
            localStorage.removeItem(getDraftKey())
            navigate(`/${currentUser.username}/${patchRequest.response.body.entity.id}`)
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
    if ( ! fileId && ! linkPreviewId && ! showLinkForm) {
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
                    <DraftImageFile fileId={fileId} setFileId={setFileId} width={150} deleteOnRemove={ ! post || post.fileId != fileId } />
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

    }

    return (
        <div className="post-form">
            <textarea 
                onChange={onContentChange} 
                value={content}
                placeholder="Write your post..."
            >
            </textarea>
            { errorView }
            <div className="attachments">
                { attachmentView }
            </div>
            <div className="controls">
                <div>{ attachmentControlsView }</div>
                <div className="buttons">
                    <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>Post</Button>
                </div>
            </div>
        </div>
    )

}

export default PostForm
