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
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPostComments, clearPostCommentQuery, getAdminPostComments } from '/state/PostComment'

export const usePostCommentQuery = function(queryParameters, options) {
    const params = queryParameters ? queryParameters : {}
    const [ searchParams, setSearchParams ] = useSearchParams()

    params.page = searchParams.get('page') || 1

    // TODO TECHDEBT The order of items in an object is not guaranteed, so just
    // because the params objects are the same does not mean the generated keys are the
    // same.  We'll probably want a solution for this at some point.
    const key = JSON.stringify(params)

    const query = useSelector((state) => key in state.PostComment.queries ? state.PostComment.queries[key] : null)

    const [ request, makeRequest ] = useRequest()

    const dispatch = useDispatch()

    const refresh = function() {
        if ( options?.admin === true ) {
            const userId = params?.userId
            makeRequest(getAdminPostComments(userId, key, params)) 
        } else {
            const postId = params?.postId
            makeRequest(getPostComments(postId, key, params)) 
        }
    }


    useEffect(() => {
        if ( query === null ) {
            if ( options?.admin === true ) {
                const userId = params?.userId
                makeRequest(getAdminPostComments(userId, key, params)) 
            } else {
                const postId = params?.postId
                makeRequest(getPostComments(postId, key, params)) 
            }
        }

        return () => {
            if ( query !== null ) {
                dispatch(clearPostCommentQuery({ name: key }))
            }
        }
    }, [ key, query ])

    return [query, request, refresh]
}


