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
import { useState, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { PlayIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import Spinner from '/components/Spinner'

import './Video.css'

/**
 * Describe a URL for logging, without its query string.  Our poster URLs are
 * signed links, and the signature and credentials live in the query string.
 */
const describeUrl = function(url) {
    try {
        const parsed = new URL(url, window.location.href)
        return `${parsed.origin}${parsed.pathname}`
    } catch (error) {
        return '(invalid URL)'
    }
}

/**
 * Renders a <video>.
 *
 * With `playOverlay`, the video is covered by its poster and a play button
 * until the user clicks to play.  The poster is a regular <img> rather than
 * the <video poster> attribute, so that we control how it loads and sizes.
 *
 * - While both the poster image and the video's metadata are loading, we
 *   show a spinner at the full width and a standard vertical video aspect
 *   ratio (4/5).
 * - Once the poster loads, it takes its own aspect ratio.  We generate
 *   posters from the video's first frame, so this matches the video.
 * - If there's no poster, it fails to load, or the video loads first, we
 *   show the play button on black, so that a slow or stuck poster never
 *   holds up the video.  This takes the 4/5 shape until the video's
 *   metadata loads, and then matches the video.  A poster that loads later
 *   replaces the black.
 * - The video loads its metadata behind the overlay so that it is ready to
 *   play.  When the user clicks, we hide the overlay, show the video and
 *   start playback programmatically.
 *
 * Without `playOverlay`, this renders a plain native <video>.
 */
const Video = function({ className, src, preload, poster, playOverlay, altText, ref, onLoad, onError }) {

    // Whether the user has pressed play on the current `src`.
    const [isActivated, setIsActivated] = useState(false)

    // The poster that finished loading, with its natural dimensions, and the
    // poster URL that failed to load, if any.  Tracked by URL so that a new
    // poster URL starts loading from scratch.
    const [loadedPoster, setLoadedPoster] = useState(null)
    const [failedPoster, setFailedPoster] = useState(null)

    // The video's dimensions, once its metadata has loaded, and the src that
    // failed to load, if any.  Both record their src, so that an event that
    // arrives late from a previous src doesn't count.
    const [videoMetadata, setVideoMetadata] = useState(null)
    const [failedSrc, setFailedSrc] = useState(null)

    // Changing the src resets the <video> to its unplayed, unloaded state, so
    // start over: bring the overlay back and wait for the new metadata.  This
    // happens when a PostGallery reuses this component to move between videos.
    const [previousSrc, setPreviousSrc] = useState(src)
    if ( src !== previousSrc ) {
        setPreviousSrc(src)
        setIsActivated(false)
        setVideoMetadata(null)
        setFailedSrc(null)
    }

    // We need our own handle on the <video> to play it, while still passing
    // the element through to any ref the caller gave us.
    const videoRef = useRef(null)
    const setVideoRef = useCallback(function(element) {
        videoRef.current = element

        if ( typeof ref === 'function' ) {
            ref(element)
        } else if ( ref !== undefined && ref !== null ) {
            ref.current = element
        }
    }, [ ref ])

    if ( ! src) {
        console.error(new Error(`'src' is required!`))
        return null
    }

    const hasPoster = poster !== undefined && poster !== null && poster !== ''
    const showOverlay = playOverlay === true && ! isActivated
    const posterFailed = hasPoster && failedPoster === poster
    const posterLoaded = hasPoster && ! posterFailed && loadedPoster !== null && loadedPoster.url === poster
    const posterLoading = hasPoster && ! posterFailed && ! posterLoaded

    const videoLoaded = videoMetadata !== null && videoMetadata.src === src
    const videoFailed = failedSrc === src
    const videoLoading = ! videoLoaded && ! videoFailed

    // Only show the spinner while we're waiting on both.  If the video is
    // ready first, show the play button rather than wait on the poster.
    const showSpinner = posterLoading && videoLoading

    const onPosterLoad = function(event) {
        const image = event.currentTarget
        setLoadedPoster({ url: poster, width: image.naturalWidth, height: image.naturalHeight })
    }

    const onPosterError = function() {
        logger.warn(`Video :: Failed to load poster image: ${describeUrl(poster)}`)
        setFailedPoster(poster)
    }

    const onLoadedMetadata = function(event) {
        const element = event.currentTarget
        setVideoMetadata({ src: src, width: element.videoWidth, height: element.videoHeight })

        if ( onLoad !== undefined && onLoad !== null ) {
            onLoad(event)
        }
    }

    const onVideoError = function(event) {
        setFailedSrc(src)

        if ( onError !== undefined && onError !== null ) {
            onError(event)
        }
    }

    const play = function() {
        // Show the video synchronously, so that it is visible when we call
        // play().  We need to call play() inside the click handler for the
        // webviews (and mobile browsers) to treat it as user initiated
        // playback.
        flushSync(() => {
            setIsActivated(true)
        })

        const video = videoRef.current
        if ( video === undefined || video === null ) {
            return
        }

        // The play button is gone now, so move focus to the video to keep
        // keyboard users in place.
        video.focus({ preventScroll: true })

        try {
            const playPromise = video.play()
            if ( playPromise !== undefined && playPromise !== null ) {
                playPromise.catch((error) => {
                    // The video is visible with its native controls at this
                    // point, so the user can still start it manually.
                    logger.warn(`Video :: Failed to start playback: ${error?.name} - ${error?.message}`)
                })
            }
        } catch (error) {
            logger.warn(`Video :: Failed to start playback: ${error?.name} - ${error?.message}`)
        }
    }

    // The overlay is a <div role="button"> rather than a <button>, because
    // drag and drop libraries won't start a drag from inside a <button>.
    // PostForm uses dnd-kit to let people reorder draft files by dragging
    // them, and the overlay covers the whole video.  (The native <video> it
    // stands in for doesn't count as a button.)  So we handle the keyboard
    // ourselves.
    const onOverlayClick = function() {
        if ( showSpinner ) {
            return
        }

        play()
    }

    const onOverlayKeyDown = function(event) {
        if ( showSpinner || event.repeat ) {
            return
        }

        if ( event.key === 'Enter' || event.key === ' ' ) {
            event.preventDefault()
            play()
        }
    }

    if ( playOverlay !== true ) {
        return (
            <video
                ref={ref}
                className={`video ${className ? className : ''}`}
                preload={ preload ? preload : "metadata" }
                aria-label={ altText !== undefined && altText !== null ? altText : undefined }
                src={src}
                poster={poster}
                onLoadedMetadata={onLoad}
                onError={onError}
                controls
                playsInline
                crossOrigin="anonymous"
            />
        )
    }

    const posterRatio = posterLoaded && loadedPoster.width > 0 && loadedPoster.height > 0
        ? `${loadedPoster.width} / ${loadedPoster.height}` : null
    const videoRatio = videoLoaded && videoMetadata.width > 0 && videoMetadata.height > 0
        ? `${videoMetadata.width} / ${videoMetadata.height}` : null

    // Everything inside the wrapper fills it, so this sizes the whole thing.
    // A null ratio leaves the stylesheet's default of 4/5.
    let aspectRatio = null
    if ( showOverlay ) {
        // The spinner keeps the default.  A loaded poster takes its own
        // aspect ratio.  The black placeholder (no poster yet) matches the
        // video once its metadata loads.
        if ( ! showSpinner ) {
            aspectRatio = posterRatio !== null ? posterRatio : videoRatio
        }
    } else {
        // Playing: match the video, falling back on the poster's shape if the
        // metadata hasn't loaded yet.
        aspectRatio = videoRatio !== null ? videoRatio : posterRatio
    }
    const wrapperStyle = aspectRatio !== null ? { aspectRatio: aspectRatio } : undefined

    return (
        <div className={`video video--overlay ${className ? className : ''}`} style={wrapperStyle}>
            <video
                ref={setVideoRef}
                className={`video__media ${ showOverlay ? 'video__media--hidden' : '' }`}
                preload={ preload ? preload : "metadata" }
                aria-label={ altText !== undefined && altText !== null ? altText : undefined }
                src={src}
                onLoadedMetadata={onLoadedMetadata}
                onError={onVideoError}
                controls
                playsInline
                crossOrigin="anonymous"
            />
            { showOverlay &&
                <div
                    className={`video__poster ${ showSpinner ? 'video__poster--loading' : '' }`}
                    role="button"
                    tabIndex={ showSpinner ? -1 : 0 }
                    aria-label={ altText !== undefined && altText !== null && altText !== '' ? `Play video: ${altText}` : 'Play video' }
                    aria-disabled={ showSpinner ? true : undefined }
                    onClick={onOverlayClick}
                    onKeyDown={onOverlayKeyDown}
                >
                    { hasPoster && ! posterFailed &&
                        <img
                            key={poster}
                            className={`video__poster__image ${ posterLoading ? 'video__poster__image--loading' : '' }`}
                            src={poster}
                            alt=""
                            draggable={false}
                            onLoad={onPosterLoad}
                            onError={onPosterError}
                        />
                    }
                    { ! showSpinner && <span className="video__poster__play" aria-hidden="true"><PlayIcon /></span> }
                </div>
            }
            { showOverlay && showSpinner && <div className="video__loading"><Spinner /></div> }
        </div>
    )
}

export default Video
