import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import logger from '/logger'

import { useLinkPreview } from '/lib/hooks/LinkPreview'

import Image from '/components/ui/Image'
import Spinner from '/components/Spinner'

import './LinkPreview.css'

const LinkPreview = function({ id }) {

    const configuration = useSelector((state) => state.system.configuration)
    const [ linkPreview, request ] = useLinkPreview(id)

    if ( linkPreview === undefined ) {
        return null
    } else if ( linkPreview === null && request?.state === 'pending' ) {
        return (
            <div className="link-preview">
                <Spinner />
            </div>
        )
    } else if ( linkPreview === null ) {
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
                { linkPreview.fileId !== null && <Image id={linkPreview.fileId} width={650} /> }
                { linkPreview.fileId === null && <Image src={linkPreview.imageUrl} /> }
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
