import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getNewsList, clearNewsQuery } from '/state/News'

/**
 * Query GET /news for a page of News posts, newest first.
 *
 * For now, the only parameter is `page`.  When the query doesn't name a page,
 * it comes from the URL's `?page=`, which is what PaginationControls sets.
 *
 * @param {object} queryParameters  (Optional) The query: `{ page: <int> }`.
 * @param {boolean} skip    (Optional) True to not make the request.
 *
 * @return {[ object|null|undefined, object|null, function ]} The query's
 * results (`{ meta, list }`, where `list` is slugs into
 * `state.News.dictionary`; `null` while loading or after a failure,
 * `undefined` before the first request), the request and a function that
 * clears the results, which requests them again.
 */
export const useNewsQuery = function(queryParameters, skip) {
    const [ searchParams ] = useSearchParams()

    let page = parseInt(queryParameters?.page ?? searchParams.get('page') ?? 1, 10)
    if ( ! (page > 0) ) {
        page = 1
    }

    const params = { page: page }
    const key = JSON.stringify(params)

    const query = useSelector((state) => key in state.News.queries ? state.News.queries[key] : undefined)

    const [ request, makeRequest ] = useRequest()

    const dispatch = useDispatch()

    // The query we last requested, so we know when the page has changed.
    const requestedKey = useRef(null)

    const reset = function() {
        dispatch(clearNewsQuery({ name: key }))
    }

    useEffect(() => {
        if ( skip ) {
            return
        }

        // Request the page when we first mount, when the page changes, and
        // when the results are cleared, which happens when a post is
        // created, deleted or moved by a new date.
        if ( requestedKey.current !== key || (query === undefined && request?.state === 'fulfilled') ) {
            requestedKey.current = key
            makeRequest(getNewsList(key, params))
        }
    }, [ key, query, request, skip ])

    return [query, request, reset]
}
