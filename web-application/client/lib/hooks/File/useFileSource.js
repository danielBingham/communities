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
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { getFileSource } from '/state/File'
import { isDueForRefresh } from '/state/File/sourceRefresh'

const hasVariant = function(file, variant) {
    if ( variant === undefined || variant === null ) {
        return true
    }

    // Files always have the root variant.
    if ( variant === 'full' ) {
        return true
    }

    if ( file.variants === null ) {
        return true
    }

    if ( Array.isArray(file.variants) ) {
        const v = file.variants.find((v) => v == variant)
        if ( v === undefined ) {
            return false
        } else {
            return v == variant
        }
    }
}

/**
 * A signed link to a file, or one of its variants, fetching it if it's
 * missing.
 *
 * Links run out (on staging and production, from 1 to 6 hours after they're
 * made), and the File slice keeps when to replace each
 * (/state/File/sourceRefresh.js). A link that's due when a component first
 * shows it is fetched again first, so the component waits for the new one
 * rather than showing one that has run out: the common case of a file shown
 * again after a while (scrolling back, navigating back, a tab coming back).
 *
 * That's decided once per link, not on every render. A link that runs out
 * while it's shown stays: the browser has already loaded it. If it has to
 * load it again and can't (a video seeking, say), File asks for a new one
 * with `refresh`.
 *
 * @param {string} fileId
 * @param {string} variant  'full' or a width.
 *
 * @return {Array} `[url, request, refresh]`: the link (undefined while it's
 * being fetched, null when there isn't one), the request for it, and a
 * function that fetches a new one.
 */
export const useFileSource = function(fileId, variant) {

    const file = useSelector((state) => fileId && fileId in state.File.dictionary ? state.File.dictionary[fileId] : null)
    const url = useSelector((state) => {
        // If we don't have a fileId, then we don't want to query a source.
        if ( fileId === undefined || fileId === null || file === null ) {
            return null
        }

        // If we don't have a variant, then don't query.
        if ( variant === undefined || variant === null ) {
            return null
        }

        // If the fileId isn't in sources already, then we need to query for
        // it.
        if ( ! (fileId in state.File.sources) ) {
            return undefined 
        }

        // If it's set to `null`, then the file doesn't exist.
        if ( state.File.sources[fileId] === null ) {
            return null
        }

        // If the file doesn't have that variant, then we don't want to query
        // for it.
        if ( ! hasVariant(file, variant) ) {
            return null
        }

        // If the variant doesn't exist in sources, then we need to query for it.
        if ( ! ( variant in state.File.sources[fileId] ) ) {
            return undefined
        }

        // Otherwise, return the variant link.
        return state.File.sources[fileId][variant]
    })  

    const refreshTime = useSelector((state) => {
        if ( fileId === undefined || fileId === null || variant === undefined || variant === null ) {
            return undefined
        }
        return state.File.sourceRefreshTimes[fileId]?.[variant]
    })

    // Whether the link was due for replacement when we first saw it. A new
    // link (or refresh time) is checked afresh. A link just fetched is never
    // due: refreshTimeFor() leaves it at least three quarters of its life.
    const due = useMemo(() => typeof url === 'string' && isDueForRefresh(refreshTime, Date.now()), [ url, refreshTime ])

    const [request, makeRequest, resetRequest ] = useRequest()

    const refresh = function() {
        makeRequest(getFileSource(fileId, variant))
    }  

    useEffect(() => {
        if ( fileId === null || fileId === undefined || request?.state === 'pending' ) {
            return
        }

        if ( ( url === undefined && request?.state !== 'failed' ) || due ) {
            if ( due ) {
                logger.debug(`useFileSource:: Replacing the link to File(${fileId}, ${variant}) before it runs out.`)
            }
            makeRequest(getFileSource(fileId, variant))
        }
    }, [ fileId, variant, url, due, request ])

    return [ due ? undefined : url, request, refresh ]
}
