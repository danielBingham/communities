import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'

import { setNewsInDictionary, setNewsNull, removeNews, setNewsQueryResults, setNewsQueryNull, clearNewsQueries } from './slice'

/**
 * GET /news or GET /news?...
 *
 * Get a page of News posts, newest first.  Populates state.dictionary and
 * state.queries[name].
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {string} name - The name of the query, which its results are kept
 * under in state.queries.
 * @param {object} params - (Optional) The query.  For now, only `page` is
 * supported.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getNewsList = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/news${( params ? '?' + qs.stringify(params) : '' )}`

        dispatch(setNewsQueryNull({ name: name }))
        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setNewsInDictionary({ dictionary: response.dictionary }))

                dispatch(setNewsQueryResults({ name: name, meta: response.meta, list: response.list }))
            }
        ))
    }
}

/**
 * POST /news
 *
 * Create a new News post.  Site admins only.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} news - A populated News post: title, slug, date, author and
 * content.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postNews = function(news) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('POST', '/news', news,
            function(response) {
                dispatch(setNewsInDictionary({ entity: response.entity }))

                // Where the new post lands in the lists depends on its date,
                // so the lists we have are stale.
                dispatch(clearNewsQueries())
            }
        ))
    }
}

/**
 * GET /news/:slug
 *
 * Get a single News post.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {string} slug - The slug of the News post we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getNews = function(slug) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/news/${encodeURIComponent(slug)}`, null,
            function(response) {
                dispatch(setNewsInDictionary({ entity: response.entity }))
            },
            function(status, response) {
                // Avoid looping on a post we can't get.
                if ( status === 404 || status === 403 || status >= 500 ) {
                    dispatch(setNewsNull(slug))
                }
            }
        ))
    }
}

/**
 * PATCH /news/:slug
 *
 * Update a News post from a partial `news` object.  The slug can't be
 * changed.  Site admins only.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} news - A partial News post, which must include its `slug`.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchNews = function(news) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/news/${encodeURIComponent(news.slug)}`, news,
            function(response) {
                dispatch(setNewsInDictionary({ entity: response.entity }))

                // A new date moves the post in the lists.
                if ( 'date' in news ) {
                    dispatch(clearNewsQueries())
                }
            }
        ))
    }
}

/**
 * DELETE /news/:slug
 *
 * Delete a News post.  Site admins only.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} news - The News post to delete.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteNews = function(news) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('DELETE', `/news/${encodeURIComponent(news.slug)}`, null,
            function(response) {
                dispatch(clearNewsQueries())
                dispatch(removeNews({ entity: news }))
            }
        ))
    }
}
