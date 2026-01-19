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
import { usePost } from './usePost'
import { useGroup } from '/lib/hooks/Group'
import { useUser } from '/lib/hooks/User'


export const usePostLink = function(id) {
    const [post] = usePost(id, { noQuery: true })
    const [group] = useGroup(post?.groupId, { noQuery: true })
    const [user] = useUser(post?.userId, { noQuery: true })

    if ( post === null || post === undefined
        || (post.groupId !== null && group !== undefined && group === null) 
        || (post.userId !== null && ! user)
    ) {
        return ''
    }
    
    let postLink = `/${user.username}/${id}`
    if ( post.groupId && group ) {
        postLink = `/group/${group.slug}/${id}`
    }

    return postLink
}
