import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { LinkIcon } from '@heroicons/react/24/outline'
import { XCircleIcon, UsersIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { usePost } from '/lib/hooks/Post'

import { GroupPostPermissions, useGroupPostPermission } from '/lib/hooks/permission'

import { deleteFile } from '/state/File'
import { postPosts, patchPost, finishPostEdit, clearSharingPost } from '/state/Post'

import FileUploadInput from '/components/files/FileUploadInput'
import DraftImageFile from '/components/files/DraftImageFile'
import LinkPreview from '/components/links/view/LinkPreview'
import Button from '/components/generic/button/Button'

import TextAreaWithMentions from '/components/posts/TextAreaWithMentions'

import LinkForm from './LinkForm/LinkForm'
import PostVisibilityControl from './PostVisibilityControl/PostVisibilityControl'

import Post from '/components/posts/Post'

import ErrorModal from '/components/errors/ErrorModal'


import './PostForm.css'

const PostForm = function({ postId, groupId, sharedPostId, origin }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)
    const [currentMember] = useGroupMember(group?.id, currentUser.id)
    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const canCreateGroupPost = useGroupPostPermission(currentUser, GroupPostPermissions.CREATE, { group: group, userMember: currentMember })

    const [content,setContent] = useState( draft && 'content' in draft ? draft.content : '')
    const [fileId,setFileId] = useState(draft && 'fileId' in draft ? draft.fileId : null)
    const [linkPreviewId, setLinkPreviewId] = useState(draft && 'linkPreviewId' in draft ? draft.linkPreviewId : null)

    let defaultVisibility = 'private'
    if ( post !== null && post.visibility !== null && post.visibility !== undefined ) {
        defaultVisibility = post.visibility
    } else if (group !== undefined && group !== null && group.type === 'open' ) {
        defaultVisibility = 'public'
    }
    const [visibility, setVisibility] = useState(draft && 'visibility' in draft && draft.visibility !== null && draft.visibility !== undefined ? draft.visibility : defaultVisibility)

    const [showLinkForm, setShowLinkForm] = useState(false)

    const [error,setError] = useState('')

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()
    const [deleteFileRequest, makeDeleteFileRequest] = useRequest()

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
        navigate(origin)
    }

    const onFileChange = function(fileId) {
        if ( sharedPostId !== null && sharedPostId !== undefined ) {
            setLinkPreviewId(null)
            setFileId(null)
            console.error('Cannot change the file when there is a shared Post.')
            return
        }

        setFileId(fileId)

        // If we're setting fileId, unset linkPreviewId.
        if ( fileId !== null && fileId !== undefined ) {
            setLinkPreviewId(null)
        }
    }

    const setLink = function(linkPreviewId) {
        if ( sharedPostId !== null && sharedPostId !== undefined ) {
            setLinkPreviewId(null)
            setFileId(null)
            console.error('Cannot change the Link when there is a shared Post.')
            return
        }

        setLinkPreviewId(linkPreviewId)

        // If we're setting the LinkPreview, then unset the file. 
        if ( linkPreviewId !== null && linkPreviewId !== undefined ) {
            setFileId(null)
        }
    }

    const onContentChange = function(newContent) {
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
        } else if ( group !== undefined && group !== null && group.type === 'open' ) {
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

    // Don't show the form if they don't have permission to post in this Group.
    if ( 
        ((groupId !== undefined && groupId !== null) || (post?.groupId !== undefined && post?.groupId !== null))
            && canCreateGroupPost !== true )
    {
        return null
    }

    let errorView = null
    if ( error == 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }

    if ( postRequest && postRequest.state == 'failed' ) {
        errorView = (
            <ErrorModal><p>Something went wrong when creating your post:</p> <p>{ postRequest.error.message }</p></ErrorModal>
        )
    }

    let attachmentView = null
    let attachmentControlsView = null
    if ( ! fileId && ! linkPreviewId && ! showLinkForm && ! (sharedPostId || post?.sharedPostId)) {
        attachmentControlsView = (
            <div className="attachment-controls">
                <div className="post-form__image">
                    <FileUploadInput 
                        text="Add Image"
                        onChange={onFileChange} 
                        fileId={fileId} 
                        setFileId={setFileId} 
                        types={[ 'image/jpeg', 'image/png' ]} 
                    />
                </div>
                <div className="post-form__link">
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
            <LinkForm setLinkPreviewId={setLink} setShowLinkForm={setShowLinkForm} />
        )

    } else if ( sharedPostId ) {
        attachmentView = (
            <Post id={sharedPostId} shared={true} />
        )
    } else if ( post && post.sharedPostId ) {
        attachmentView = (
            <Post id={post.sharedPostId} shared={true} />
        )
    }


    return (
        <div className="post-form">
            <TextAreaWithMentions
                value={content}
                setValue={onContentChange}
                placeholder={group ? `Write a post in ${group.title}...` : "Write a post to your feed..." }
                groupId={groupId}
            />

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
                <Button onClick={(e) => cancel()}>Cancel</Button>
                <Button type="primary" onClick={(e) => submit()}>Post</Button>
            </div>
        </div>
    )

}

export default PostForm
