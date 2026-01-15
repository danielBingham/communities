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
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getPost } from '/state/Post'

export const usePost = function(postId, options) {
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null)

    const [request, makeRequest, resetRequest ] = useRequest()

    const refresh = function() {
        if ( options?.noQuery !== true ) {
            makeRequest(getPost(postId))
        }
    }

    useEffect(() => {
        if ( postId && post === null && request === null 
            && options?.noQuery !== true && options?.skip !== true
        ) {
            makeRequest(getPost(postId))
        }
    }, [ postId, post, request ])

    return [post, request, refresh]
}
