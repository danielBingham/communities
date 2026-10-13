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
 * Renders a <video>.
 *
 * With `playOverlay`, the video is covered by its poster and a play button
 * until the user clicks to play.  The poster is a regular <img> rather than
 * the <video poster> attribute, so that we control how it loads and sizes.
 *
 * - While the poster image loads, we show a spinner on white, at the full
 *   width and a standard vertical video aspect ratio (4/5).
 * - Once the poster loads, it takes its own aspect ratio.  We generate
 *   posters from the video's first frame, so this matches the video.
 * - If there's no poster, or it fails to load, we show the play button on
 *   black.  This takes the 4/5 shape until the video's metadata loads, and
 *   then matches the video.
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

    // The video's dimensions, once its metadata has loaded, along with the
    // src they belong to.
    const [videoSize, setVideoSize] = useState(null)

    // Changing the src resets the <video> to its unplayed state, so bring the
    // overlay back.  This happens when a PostGallery reuses this component to
    // move between videos.
    const [previousSrc, setPreviousSrc] = useState(src)
    if ( src !== previousSrc ) {
        setPreviousSrc(src)
        setIsActivated(false)
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

    const onPosterLoad = function(event) {
        const image = event.currentTarget
        setLoadedPoster({ url: poster, width: image.naturalWidth, height: image.naturalHeight })
    }

    const onLoadedMetadata = function(event) {
        const element = event.currentTarget
        if ( element.videoWidth > 0 && element.videoHeight > 0 ) {
            setVideoSize({ src: src, width: element.videoWidth, height: element.videoHeight })
        }

        if ( onLoad !== undefined && onLoad !== null ) {
            onLoad(event)
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
        if ( posterLoading ) {
            return
        }

        play()
    }

    const onOverlayKeyDown = function(event) {
        if ( posterLoading || event.repeat ) {
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
                crossOrigin="anonymous"
            />
        )
    }

    const posterRatio = posterLoaded && loadedPoster.width > 0 && loadedPoster.height > 0
        ? `${loadedPoster.width} / ${loadedPoster.height}` : null
    const videoRatio = videoSize !== null && videoSize.src === src
        ? `${videoSize.width} / ${videoSize.height}` : null

    // Everything inside the wrapper fills it, so this sizes the whole thing.
    // A null ratio leaves the stylesheet's default of 4/5.
    let aspectRatio = null
    if ( showOverlay ) {
        // The spinner keeps the default.  A loaded poster takes its own
        // aspect ratio.  The placeholder for a missing poster matches the
        // video once its metadata loads.
        if ( ! posterLoading ) {
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
                onError={onError}
                controls
                crossOrigin="anonymous"
            />
            { showOverlay &&
                <div
                    className={`video__poster ${ posterLoading ? 'video__poster--loading' : '' }`}
                    role="button"
                    tabIndex={ posterLoading ? -1 : 0 }
                    aria-label={ altText !== undefined && altText !== null && altText !== '' ? `Play video: ${altText}` : 'Play video' }
                    aria-disabled={ posterLoading ? true : undefined }
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
                            onError={() => setFailedPoster(poster)}
                        />
                    }
                    { ! posterLoading && <span className="video__poster__play" aria-hidden="true"><PlayIcon /></span> }
                </div>
            }
            { showOverlay && posterLoading && <div className="video__loading"><Spinner /></div> }
        </div>
    )
}

export default Video
