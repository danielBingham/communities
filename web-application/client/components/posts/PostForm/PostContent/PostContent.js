import { useState, useRef, useEffect } from 'react'

import * as linkify from 'linkifyjs'
import "linkify-plugin-mention"

import logger from '/logger'

import { postLinkPreviews } from '/state/LinkPreview'

import { useRequest } from '/lib/hooks/useRequest'

import { useGroup } from '/lib/hooks/Group'
import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import TextAreaWithMentions from '/components/posts/TextAreaWithMentions'

import './PostContent.css'

const PostContent = function({ postId, groupId, sharedPostId }) {
    const [ error, setError] = useState(null)

    const [url, setUrl] = useState('')
    const [failedLinks, setFailedLinks] = useState([])

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)

    const [request, makeRequest] = useRequest()

    const timeoutId = useRef(null)

    const setContent = function(content) {
        const newDraft = { ...draft }

        newDraft.content = content 

        setDraft(newDraft)
    }

    const setLinkPreviewId = function(linkPreviewId) {
        const newDraft = { ...draft }

        newDraft.linkPreviewId = linkPreviewId 
        newDraft.fileId = null 
        newDraft.sharedPostId = null

        setDraft(newDraft)
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
        if ( timeoutId.current !== null ) {
            clearTimeout(timeoutId.current) 
        }

        if ( draft.linkPreviewId !== null && draft.linkPreviewId !== undefined ) {
            return
        }

        if ( draft.sharedPostId !== null && draft.sharedPostId !== undefined ) {
            return
        }

        if (draft.fileId !== null && draft.fileId !== undefined ) {
            return
        }

        timeoutId.current = setTimeout(() => {
            const links = linkify.find(draft.content)
            if ( links.length > 0 ) {
                for(const link of links ) {
                    if ( link.type !== 'url' ) {
                        continue
                    }

                    if ( failedLinks.includes(link.href) ) {
                        continue
                    }

                    setUrl(link.href)
                    const preview = {
                        url: link.href
                    }
                    makeRequest(postLinkPreviews(preview))
                    break
                }
            } else if ( draft.linkPreviewId !== null ) {
                setLinkPreviewId(null)
            }
        }, 500)
    }, [ draft ])

    useEffect(function() {
        if ( request?.state == 'fulfilled') {
            setLinkPreviewId(request.response.body.entity.id)
        } else if ( request?.state === 'failed' ) {
            setLinkPreviewId(null)
            setFailedLinks([ ...failedLinks, url ])
            logger.warn(`Attempt to retrieve link preview failed: `, request.error)
        }
    }, [ request, url ])

    let errorView = null
    if ( error === 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }

    return (
        <div className="post-content">
            <TextAreaWithMentions
                value={draft.content}
                setValue={onContentChange}
                placeholder={group ? `Write a post in ${group.title}...` : "Write a post to your feed..." }
                groupId={groupId}
            />

            { errorView }
        </div>
    )

}

export default PostContent
