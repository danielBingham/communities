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
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getNews } from '/state/News'

/**
 * Get a News post by its slug, requesting it from the backend if we don't
 * have it yet.
 *
 * @param {string} slug     The post's slug.
 * @param {object} options  (Optional) `skip: true` to never request it.
 *
 * @return {[ object|null|undefined, object|null, function ]} The post (`null`
 * when it doesn't exist, `undefined` until we know), the request for it and
 * a function to request it again.
 */
export const useNews = function(slug, options) {
    const news = useSelector((state) => {
        if ( ! slug ) {
            return null
        }

        // The slug comes from the URL, so make sure it names a post rather
        // than something every object has, like 'constructor'.
        if ( ! Object.hasOwn(state.News.dictionary, slug) ) {
            return undefined
        }

        return state.News.dictionary[slug]
    })

    const [request, makeRequest] = useRequest()

    // The slug we last requested, so we don't keep requesting one that
    // failed, and do request a new one when the slug changes.
    const requestedSlug = useRef(null)

    const reload = function() {
        requestedSlug.current = slug
        makeRequest(getNews(slug))
    }

    useEffect(() => {
        if ( ! slug || news !== undefined || options?.skip === true ) {
            return
        }

        if ( request?.state === 'pending' || requestedSlug.current === slug ) {
            return
        }

        reload()
    }, [ slug, news, request ])

    return [news, request, reload]
}
