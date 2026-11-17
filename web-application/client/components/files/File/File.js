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

import './File.css'

/**
 * A file's links run out (on staging and production, from 1 to 6 hours after
 * they're made). useFileSource replaces a link that's due before it's shown,
 * but one can still run out while it's shown: a video that loads more as it
 * plays or seeks, or an image the browser loads again. So when a file fails
 * to load, we ask for a new link and try again, once a minute at most: a new
 * link that fails straight away means the file itself is the problem, and we
 * give up as before (`onError`, and the fallback).
 */
const RETRY_INTERVAL_MS = 60 * 1000

/**
 * Asks for a new link with `refresh` unless it did within RETRY_INTERVAL_MS.
 *
 * @return {Function} `retry(refresh)`, which returns whether it asked.
 */
const useRetry = function() {
    const lastRetry = useRef(null)

    return function(refresh) {
        const now = Date.now()
        if ( lastRetry.current !== null && now - lastRetry.current < RETRY_INTERVAL_MS ) {
            return false
        }

        lastRetry.current = now
        refresh()
        return true
    }
}

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

    const retryFile = useRetry()
    const retryPoster = useRetry()

    // If the caller provided a ref, we'll use that. Otherwise, we'll use this
    // as a fallback to get a ref on Video components, so that we can pause the
    // video on unmount.
    const videoRef = useRef(null)

    const videoUploadsEnabled = useFeature('video-uploads')

    // The file failed to load, perhaps because its link ran out: ask for a
    // new link to whichever we're showing, the variant or the full file.
    // Only when we've just done that do we give up and tell the caller.
    const onErrorInternal = function(event) {
        try {
            const retrying = retryFile(url !== null ? refreshFileSource : refreshRoot)
            logger.warn(`File(${id}, ${width}):: Failed to load (${event?.target?.error?.code ?? 'no code'}). `
                + (retrying ? 'Asking for a new link.' : 'Giving up.'))

            if ( ! retrying && onError !== undefined && onError !== null ) {
                onError(event)
            }
        } catch (error) {
            logger.error(error)
        }
    }

    // A video's poster failed to load: the same, for the thumbnail's link.
    // Video shows the video's first frame on black meanwhile.
    const onPosterErrorInternal = function() {
        try {
            const retrying = retryPoster(thumbnailUrl !== null ? refreshThumbnail : refreshRootThumbnail)
            logger.warn(`File(${id}, ${width}):: Failed to load the poster. ` + (retrying ? 'Asking for a new link.' : 'Giving up.'))
        } catch (error) {
            logger.error(error)
        }
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
        if ( fallback === true ) {
            return (
                <div className={`file__fallback ${ className ? className : '' }`}>
                    <div className="file__fallback__icon"> { type && type === 'video' ? <VideoCameraIcon /> : <PhotoIcon /> }</div>
                    <p>Failed to load { type && type === 'video' ? 'video' : 'image' }.  If the error persists while you have a good connection, please report as a bug!</p>
                </div>
            )
        }

        return null
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
            return ( <Video className={`file ${className ? className : ''}`} src={url} mediaKey={`${file.id}/${width}`} poster={thumb} playOverlay={true} onLoad={onLoad} onError={onErrorInternal} onPosterError={onPosterErrorInternal} ref={ref ? ref : videoRef} />)
        }

        return ( <Image className={`file ${className ? className : ''}`} src={url} onLoad={onLoad} onError={onErrorInternal} crossOrigin={true} ref={ref} /> )
    } else if ( url === null && rootUrl !== null ) {
        if ( filetype === 'video' ) {
            return ( <Video className={`file ${className ? className : ''}`} src={rootUrl} mediaKey={`${file.id}/full`} poster={thumb} playOverlay={true} onLoad={onLoad} onError={onErrorInternal} onPosterError={onPosterErrorInternal} ref={ref ? ref : videoRef} />)
        }

        return ( <Image className={`file ${className ? className : ''}`} src={rootUrl} onLoad={onLoad} onError={onErrorInternal} crossOrigin={true} ref={ref} /> )
    }
}

export default File
