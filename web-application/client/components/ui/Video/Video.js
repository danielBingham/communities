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

import './Video.css'

/**
 * Renders a <video>.
 *
 * When a `poster` is provided, we don't use the <video poster> attribute,
 * because poster images loaded from signed S3 links fail to show up in the
 * Capacitor webviews on iOS and Android.  Instead, we render the poster as a
 * regular <img> absolutely positioned over the video, along with a play
 * button.  The video loads its metadata behind the poster so that it is ready
 * to play.  When the user clicks the poster, we hide it, show the video and
 * start playback programmatically.
 */
const Video = function({ className, src, preload, poster, altText, ref, onLoad, onError }) {

    // The `src` the user has pressed play on.  We track the src rather than a
    // boolean so that the poster comes back if this component is reused for a
    // different video (eg. moving between videos in a PostGallery), since
    // changing the src resets the <video> to its unplayed state anyway.
    const [activatedSrc, setActivatedSrc] = useState(null)

    // The poster URL that failed to load, if any.  Tracked by URL so that a
    // new poster URL gets a fresh attempt.
    const [failedPoster, setFailedPoster] = useState(null)

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
    const showPoster = hasPoster && activatedSrc !== src
    const posterFailed = hasPoster && failedPoster === poster

    const play = function() {
        // Show the video synchronously, so that it is visible when we call
        // play().  We need to call play() inside the click handler for the
        // webviews (and mobile browsers) to treat it as user initiated
        // playback.
        flushSync(() => {
            setActivatedSrc(src)
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

    const video = (
        <video
            ref={setVideoRef}
            className={ hasPoster
                ? `video__media ${ showPoster ? 'video__media--hidden' : '' }`
                : `video ${className ? className : ''}`
            }
            preload={ preload ? preload : "metadata" }
            aria-label={ altText !== undefined && altText !== null ? altText : undefined }
            src={src}
            onLoadedMetadata={onLoad}
            onError={onError}
            controls
            crossOrigin="anonymous"
        />
    )

    if ( ! hasPoster ) {
        return video
    }

    return (
        <div className={`video video--with-poster ${className ? className : ''}`}>
            { video }
            { showPoster &&
                <button
                    type="button"
                    className="video__poster"
                    aria-label={ altText !== undefined && altText !== null && altText !== '' ? `Play video: ${altText}` : 'Play video' }
                    onClick={play}
                >
                    { ! posterFailed &&
                        <img
                            className="video__poster__image"
                            src={poster}
                            alt=""
                            draggable={false}
                            onError={() => setFailedPoster(poster)}
                        />
                    }
                    <span className="video__poster__play" aria-hidden="true"><PlayIcon /></span>
                </button>
            }
        </div>
    )
}

export default Video
