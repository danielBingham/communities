import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { getLinkPreview } from '/state/LinkPreview'

import './LinkPreview.css'

const LinkPreview = function({ id }) {

    const [request, makeRequest] = useRequest()

    const linkPreview = useSelector((state) => id && id in state.LinkPreview.dictionary ? state.LinkPreview.dictionary[id] : null) 

    useEffect(function() {
        if ( id ) {
            makeRequest(getLinkPreview(id))
        } else {
            logger.error(new Error('Attempt to load a LinkPreview without an id.'))
        }
    }, [id])

    if ( ! linkPreview ) {
        return null
    }

    let description = linkPreview.description
    if ( description.length > 300 ) {
        description = description.substring(0,300) + '...'
    }

    // Handle youtube videos.
    const url = new URL(linkPreview.url)
    if ( url.host == 'www.youtube.com' || url.host == 'youtube.com' || url.host == 'youtu.be' ) {
        let videoId = ''
        if ( url.host === 'www.youtube.com' || url.host === 'youtube.com' ) {
            let firstSegment = url.pathname.split('/')[1]
            if ( firstSegment == 'watch' ) {
                const searchParams = url.searchParams
                videoId = searchParams.get("v")
            }
        } else if ( url.host == 'youtu.be' ) {
            videoId = url.pathname.split('/')[1]
        }  

        if ( videoId !== '' ) {
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
    }

    return (
        <div className="link-preview">
            <a target="_blank" href={linkPreview.url}>
                <img src={linkPreview.imageUrl} />
                <div className="link-preview__details">
                    <div className="link-preview__site">{linkPreview.siteName}</div>
                    <h2 className="link-preview__title">{linkPreview.title}</h2>
                    <div className="link-preview__description">{description}</div>
                </div>
            </a>
        </div>
    )


}

export default LinkPreview
