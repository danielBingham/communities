import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { LinkIcon } from '@heroicons/react/24/outline'
import { XCircleIcon, UsersIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { usePostDraft } from '/lib/hooks/usePostDraft'
import { extractMentionData, createMention, insertMention, convertMentionsForStorage } from '/lib/mentions'
import MentionsDropdown from '/components/mentions/MentionsDropdown'

import { deleteFile } from '/state/files'
import { postPosts, patchPost, finishPostEdit } from '/state/posts'

import FileUploadInput from '/components/files/FileUploadInput'
import DraftImageFile from '/components/files/DraftImageFile'
import LinkForm from '/components/posts/form/controls/LinkForm'
import LinkPreview from '/components/links/view/LinkPreview'
import Button from '/components/generic/button/Button'
import PostVisibility from '/components/posts/form/controls/PostVisibility'


import './PostForm.css'

const PostForm = function({ postId, groupId }) {

    const [draft, setDraft] = usePostDraft(postId || null)

    const [content, setContent] = useState(draft ? draft.content : '')
    const [fileId, setFileId] = useState(draft ? draft.fileId : null)
    const [linkPreviewId, setLinkPreviewId] = useState(draft ? draft.linkPreviewId : null)
    const [mentions, setMentions] = useState(draft && draft.mentions ? draft.mentions : [])
    const [mentionData, setMentionData] = useState(null)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef(null)

    const [showLinkForm, setShowLinkForm] = useState(false)

    const [error,setError] = useState('')

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()
    const [deleteFileRequest, makeDeleteFileRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.posts.dictionary ? state.posts.dictionary[postId] : null)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const submit = function() {
        // Convert mentions to storage format
        const { storageMentions } = convertMentionsForStorage(content, mentions)
        
        const newPost = {
            type: 'feed',
            userId: currentUser.id,
            fileId: fileId,
            linkPreviewId: linkPreviewId,
            content: content,
            mentions: storageMentions
        }

        if (groupId) {
            newPost.type = 'group'
            newPost.groupId = groupId
        }

        if (!postId) {
            makePostRequest(postPosts(newPost))
        } else { 
            newPost.id = postId
            makePatchRequest(patchPost(newPost))
            
            if (post.fileId !== fileId) {
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
        setMentions([])
        setError('')

        if (!post || (fileId !== null && post.fileId !== fileId)) {
            makeDeleteFileRequest(deleteFile(fileId))
        }

        if (postId) {
            dispatch(finishPostEdit(postId))
        }
    }

    const onFileChange = function(fileId) {
        setFileId(fileId)
    }

    const onContentChange = function(event) {
        const newContent = event.target.value
        if (newContent.length > 10000) {
            setError('overlength')
        } else {
            setError('')
            setContent(newContent)
            
            // Check for mentions
            const { mentionData: newMentionData } = extractMentionData(
                newContent, 
                event.target.selectionStart
            )
            setMentionData(newMentionData)
            setCursorPosition(event.target.selectionStart)
        }
    }
    
    const handleSelectMention = (user, position, query) => {
        const mention = createMention(user, position, query)
        const { text: newText, cursorPosition: newCursorPosition } = insertMention(
            content,
            mention,
            cursorPosition
        )
        
        setContent(newText)
        setMentions([...mentions, mention])
        setMentionData(null)
        
        // Set focus back to textarea and update cursor position
        if (textareaRef.current) {
            textareaRef.current.focus()
            setTimeout(() => {
                textareaRef.current.selectionStart = newCursorPosition
                textareaRef.current.selectionEnd = newCursorPosition
            }, 0)
        }
    }
    
    const handleCloseMentions = () => {
        setMentionData(null)
    }

    useEffect(function() {
        setDraft({ 
            content: content, 
            fileId: fileId, 
            linkPreviewId: linkPreviewId,
            mentions: mentions
        })
    }, [postId, content, fileId, linkPreviewId, mentions])

    useEffect(function() {
        if (postRequest && postRequest.state == 'fulfilled') {
            setDraft(null)
            navigate(`/${currentUser.username}/${postRequest.response.body.entity.id}`)
        }
    }, [postRequest])

    useEffect(function() {
        if (patchRequest && patchRequest.state == 'fulfilled') {
            setDraft(null) 
        }
    }, [patchRequest])

    let errorView = null
    if (error == 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }

    let attachmentView = null
    let attachmentControlsView = null
    if (!fileId && !linkPreviewId && !showLinkForm) {
        attachmentControlsView = (
            <div className="attachment-controls">
                <div className="image">
                    <FileUploadInput 
                        text="Add Image"
                        onChange={onFileChange} 
                        fileId={fileId} 
                        setFileId={setFileId} 
                        types={['image/jpeg', 'image/png']} 
                    />
                </div>
                <div className="link">
                    <Button type="primary" onClick={(e) => {setShowLinkForm(true)}}><LinkIcon /><span className="attachment-button-text"> Add Link</span></Button>
                </div>
            </div>
        )
    } else if (fileId) {
        attachmentView = (
            <div className="attachment">
                <div className="attached">
                    <DraftImageFile fileId={fileId} setFileId={setFileId} width={150} deleteOnRemove={!post || post.fileId != fileId} />
                </div>
            </div>
        )
    } else if (linkPreviewId) {
        attachmentView = (
            <div className="link-preview">
                <a className="remove" href="" onClick={(e) => { e.preventDefault(); setLinkPreviewId(null) }}><XCircleIcon /></a>
                <LinkPreview id={linkPreviewId} />
            </div>
        )
    } else if (showLinkForm) {
        attachmentView = (
            <LinkForm setLinkPreviewId={setLinkPreviewId} setShowLinkForm={setShowLinkForm} />
        )
    }

    return (
        <div className="post-form">
            <div className="textarea-container">
                <textarea 
                    ref={textareaRef}
                    onChange={onContentChange} 
                    value={content}
                    placeholder="Write your post..."
                >
                </textarea>
                {mentionData && (
                    <MentionsDropdown
                        mentionData={mentionData}
                        onSelectMention={handleSelectMention}
                        onClose={handleCloseMentions}
                    />
                )}
            </div>
            {errorView}
            <div className="attachments">
                {attachmentView}
            </div>
            <div className="post-form__controls">
                <div className="post-form__controls__attachments">{attachmentControlsView}</div>
                <div className="post-form__controls__visibility"><PostVisibility groupId={groupId} /></div>
            </div>
            <div className="buttons">
                <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                <Button type="primary" onClick={(e) => submit()}>Post</Button>
            </div>
        </div>
    )
}

export default PostForm
