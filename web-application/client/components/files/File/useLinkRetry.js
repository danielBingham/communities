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
import { useState, useRef, useEffect } from 'react'

import logger from '/logger'

/**
 * How long to wait before asking again for a new link when asking didn't get
 * one: the request failed without an answer (makeRequest's catch path:
 * offline, a connection reset, a request the browser gave up on), or it came
 * back with the same link as the one that failed. One delay per further
 * try, in milliseconds; after the last, we give up.
 */
export const RETRY_DELAYS_MS = [ 2*1000, 10*1000, 30*1000 ]

/**
 * Keeps a file's signed link working while it's shown.
 *
 * Links run out (on staging and production, when the credentials they're
 * signed with expire, which the API can't predict), so when the file fails
 * to load we ask for a new link with `refresh` and show that. Each link
 * goes through:
 *
 * - shown: the link we were given, or one that has loaded. If it fails, we
 *   ask for a new one. However often a link that loaded fails later, as a
 *   video playing past its credentials can, we ask again.
 * - replacing: asking. If the request fails without an answer, or gives us
 *   the same link back (signed in the same second with the same
 *   credentials, so the element wouldn't load it again), we wait
 *   (RETRY_DELAYS_MS) and ask again, and give up after the last try. If it
 *   fails with an answer, useFileSource sets the link to null and File
 *   falls back on the full file, and then its fallback.
 * - trying: showing the new link. If it loads, it's shown. If it fails
 *   before it loads, the file itself is the problem (a new link is good for
 *   5 minutes at the very least), so we give up.
 * - gave up: `onGiveUp` with the last error event, and `gaveUp` is true. A
 *   link that loads after all (another component replaced the shared one)
 *   takes us back to shown.
 *
 * @param {Object} options
 * @param {string} options.label    What's shown, for the log.
 * @param {string|null|undefined} options.url   The link being shown.
 * @param {Object} options.request  The latest request for it, from
 * useFileSource.
 * @param {Function} options.refresh    Asks for a new link, from
 * useFileSource.
 * @param {Function} [options.onGiveUp] Called with the last error event when
 * we give up.
 *
 * @return {Object} `{ onError, onLoad, gaveUp }`: handlers for the element
 * showing the link, and whether we've given up.
 */
export const useLinkRetry = function({ label, url, request, refresh, onGiveUp }) {
    const phase = useRef('shown')

    // The link that failed, the last error event, and how many times we've
    // asked for a new link since.
    const failedUrl = useRef(null)
    const lastError = useRef(null)
    const tries = useRef(0)

    // The request that was current when we last asked: any other is ours.
    const askedWith = useRef(null)
    const timer = useRef(null)

    const [gaveUp, setGaveUp] = useState(false)

    // For the timer, which fires after a render or two.
    const latest = useRef(null)
    latest.current = { url: url, request: request, refresh: refresh, onGiveUp: onGiveUp }

    const ask = function() {
        tries.current += 1
        askedWith.current = latest.current.request
        latest.current.refresh()
    }

    const giveUp = function() {
        phase.current = 'gave-up'
        logger.warn(`${label}:: Failed to load, and a new link didn't help. Giving up.`)
        setGaveUp(true)

        const callback = latest.current.onGiveUp
        if ( callback !== undefined && callback !== null ) {
            callback(lastError.current)
        }
    }

    useEffect(() => {
        if ( phase.current !== 'replacing' ) {
            return
        }

        // No link now: the request failed with an answer, and File falls
        // back on the full file, or its fallback.
        if ( url === null || url === undefined ) {
            phase.current = 'shown'
            return
        }

        // A new link, from our request or another component's.
        if ( url !== failedUrl.current ) {
            phase.current = 'trying'
            return
        }

        // Still waiting on our request.
        if ( request === askedWith.current || request?.state === 'pending' ) {
            return
        }

        // Our request is done and left the same link.
        if ( tries.current > RETRY_DELAYS_MS.length ) {
            giveUp()
            return
        }

        const delay = RETRY_DELAYS_MS[tries.current - 1]
        logger.warn(`${label}:: Didn't get a new link (${request?.state === 'failed' ? 'the request failed' : 'the same link came back'}). `
            + `Asking again in ${delay / 1000} seconds.`)
        timer.current = setTimeout(function() {
            timer.current = null
            ask()
        }, delay)
    }, [ url, request ])

    useEffect(() => {
        return function cleanup() {
            if ( timer.current !== null ) {
                clearTimeout(timer.current)
                timer.current = null
            }
        }
    }, [])

    const onError = function(event) {
        lastError.current = event

        if ( phase.current === 'shown' ) {
            logger.warn(`${label}:: Failed to load (${event?.target?.error?.code ?? 'no code'}). Asking for a new link.`)
            phase.current = 'replacing'
            failedUrl.current = url
            tries.current = 0
            ask()
        } else if ( phase.current === 'trying' ) {
            giveUp()
        }
        // While replacing, the old link failing again changes nothing. Once
        // we've given up, neither does anything else.
    }

    const onLoad = function() {
        if ( phase.current === 'trying' || phase.current === 'gave-up' ) {
            phase.current = 'shown'
            setGaveUp(false)
        }
    }

    return { onError: onError, onLoad: onLoad, gaveUp: gaveUp }
}
