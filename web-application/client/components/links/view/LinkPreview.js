import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getLinkPreview, cleanupRequest } from '/state/linkPreviews'

import './LinkPreview.css'

const LinkPreview = function({ id }) {

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.linkPreviews.requests ) {
            return state.linkPreviews.requests[requestId]
        } else {
            return null
        }
    })

    const linkPreview = useSelector(function(state) {
        if ( id in state.linkPreviews.dictionary ) {
            return state.linkPreviews.dictionary[id]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getLinkPreview(id)))
    }, [id])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    if ( ! linkPreview ) {
        return null
    }

    let description = linkPreview.description
    if ( description.length > 300 ) {
        description = description.substring(0,300) + '...'
    }

    const url = new URL(linkPreview.url)
    if ( url.host == 'www.youtube.com' || url.host == 'youtube.com' || url.host == 'youtu.be' ) {
        const searchParams = url.searchParams
        const videoId = searchParams.get("v")
        return ( 
            <div className="link-preview">
                <iframe
                    src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`}
                    allow="encrypted-media"
                    allowFullScreen
                    title="youtube video"
                />
            </div>
        )
    }

    return (
        <div className="link-preview">
            <a target="_blank" href={linkPreview.url}>
                <img src={linkPreview.imageUrl} />
                <div className="details">
                    <div className="site">{linkPreview.siteName}</div>
                    <h2 className="title">{linkPreview.title}</h2>
                    <div className="description">{description}</div>
                </div>
            </a>
        </div>
    )


}

export default LinkPreview
