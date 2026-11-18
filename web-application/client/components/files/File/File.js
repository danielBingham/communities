/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useEffect, useRef } from 'react'
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { useFile, useFileSource } from '/lib/hooks/File'
import { useFeature } from '/lib/hooks/feature/useFeature'

import Image from '/components/ui/Image'
import Video from '/components/ui/Video'

import Spinner from '/components/Spinner'

import { useLinkRetry } from './useLinkRetry'

import './File.css'

const File = function({ id, width, type, fallback, className, onLoad, onError, ref }) {
    const [file, fileRequest] = useFile(id, width)
    const [thumbnail, thumbnailRequest] = useFile( file?.kind === 'video' && file?.thumbId ? file.thumbId : undefined, width)

    // TECHDEBT HACK: Need to reference the id through the file to ensure that we retrieve the
    // file first and only retrieve the source URL if we actually successfully
    // retreive the file.
    // 
    // We should probably handle this better in useFileSource.  Right now
    // there's a case, where you can generate an error by calling useFileSource
    // without first calling the file.
    const [url, sourceRequest, refreshFileSource] = useFileSource(file?.id, width)
    const [ thumbnailUrl, thumnailUrlRequest, refreshThumbnail] = useFileSource(thumbnail?.id, width)

    // If we fail to load the requested variant URL, then fall back on the full URL.
    const [rootUrl, rootRequest, refreshRoot] = useFileSource(url === null ? file?.id : null, 'full')
    const [rootThumbnailUrl, rootThumbnailUrlRequest, refreshRootThumbnail] = useFileSource(thumbnailUrl === null ? thumbnail?.id : null, 'full')

    // Links run out, and the API can't say when: when the file or its poster
    // fails to load, ask for a new link to whichever we're showing, the
    // variant or the full file (see useLinkRetry.js).
    const fileRetry = useLinkRetry({
        label: `File(${id}, ${width})`,
        url: url !== null ? url : rootUrl,
        request: url !== null ? sourceRequest : rootRequest,
        refresh: url !== null ? refreshFileSource : refreshRoot,
        onGiveUp: function(event) {
            if ( onError !== undefined && onError !== null ) {
                onError(event)
            }
        }
    })
    const posterRetry = useLinkRetry({
        label: `File(${id}, ${width}) poster`,
        url: thumbnailUrl !== null ? thumbnailUrl : rootThumbnailUrl,
        request: thumbnailUrl !== null ? thumnailUrlRequest : rootThumbnailUrlRequest,
        refresh: thumbnailUrl !== null ? refreshThumbnail : refreshRootThumbnail
    })

    // If the caller provided a ref, we'll use that. Otherwise, we'll use this
    // as a fallback to get a ref on Video components, so that we can pause the
    // video on unmount.
    const videoRef = useRef(null)

    const videoUploadsEnabled = useFeature('video-uploads')

    const onLoadInternal = function(event) {
        fileRetry.onLoad()

        if ( onLoad !== undefined && onLoad !== null ) {
            onLoad(event)
        }
    }

    const onErrorInternal = function(event) {
        try {
            fileRetry.onError(event)
        } catch (error) {
            logger.error(error)
        }
    }

    // Video shows the play button on black while the poster is missing.
    const onPosterLoadInternal = function() {
        posterRetry.onLoad()
    }

    const onPosterErrorInternal = function(event) {
        try {
            posterRetry.onError(event)
        } catch (error) {
            logger.error(error)
        }
    }

    const renderFallback = function() {
        if ( fallback !== true ) {
            return null
        }

        return (
            <div className={`file__fallback ${ className ? className : '' }`}>
                <div className="file__fallback__icon"> { type && type === 'video' ? <VideoCameraIcon /> : <PhotoIcon /> }</div>
                <p>Failed to load { type && type === 'video' ? 'video' : 'image' }.  If the error persists while you have a good connection, please report as a bug!</p>
            </div>
        )
    }

    useEffect(() => {
        return function cleanup() {
            // Pause the video on unmount.
            if ( file?.kind === "video" ) {
                if ( ref?.current !== undefined && ref?.current !== null ) {
                    ref.current.pause()
                } else if ( videoRef?.current !== undefined && videoRef?.current !== null ) {
                    videoRef.current.pause()
                }
            }
        }
    }, [ file ])

    // ========================================================================
    //      RENDER
    // ========================================================================

    if ( file === undefined 
        || ( url === undefined 
            || (url === null && rootUrl === undefined)
        )
    ) {
        return (<div className={`file ${className ? className: ''}`}><Spinner /></div> )
    }


    if ( file?.kind === 'video' && 
        ( thumbnail === undefined || thumbnailUrl === undefined || (thumbnailUrl === null && rootThumbnailUrl === undefined))
    ) {
        return ( <div className={`file ${className ? className : ''}`}><Spinner /></div> )
    }

    if ( file === null ||  ( url === null && rootUrl === null ) ) {
        return renderFallback()
    }

    // We've given up on the link: show the fallback, if there is one, rather
    // than a broken file.
    if ( fileRetry.gaveUp && fallback === true ) {
        return renderFallback()
    }

    const filetype = file.type.split('/')[0]
    if ( type !== undefined && type !== null && type !== filetype ) {
        logger.error(`## File(${id}, ${width}):: Specified type, '${type}', does not match File type, '${filetype}'.`)
        return null
    }

    if ( filetype === 'video' &&  videoUploadsEnabled !== true ) {
        return null
    }

    let thumb = thumbnailUrl
    if ( thumb === null || thumb === undefined ) {
        thumb = rootThumbnailUrl
    }

    if ( url !== null ) {
        if ( filetype === 'video' ) {
            return ( <Video className={`file ${className ? className : ''}`} src={url} mediaKey={`${file.id}/${width}`} poster={thumb} playOverlay={true} onLoad={onLoadInternal} onError={onErrorInternal} onPosterLoad={onPosterLoadInternal} onPosterError={onPosterErrorInternal} ref={ref ? ref : videoRef} />)
        }

        return ( <Image className={`file ${className ? className : ''}`} src={url} onLoad={onLoadInternal} onError={onErrorInternal} crossOrigin={true} ref={ref} /> )
    } else if ( url === null && rootUrl !== null ) {
        if ( filetype === 'video' ) {
            return ( <Video className={`file ${className ? className : ''}`} src={rootUrl} mediaKey={`${file.id}/full`} poster={thumb} playOverlay={true} onLoad={onLoadInternal} onError={onErrorInternal} onPosterLoad={onPosterLoadInternal} onPosterError={onPosterErrorInternal} ref={ref ? ref : videoRef} />)
        }

        return ( <Image className={`file ${className ? className : ''}`} src={rootUrl} onLoad={onLoadInternal} onError={onErrorInternal} crossOrigin={true} ref={ref} /> )
    }
}

export default File
