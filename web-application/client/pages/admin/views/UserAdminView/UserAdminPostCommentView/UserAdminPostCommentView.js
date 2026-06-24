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
import { usePostCommentQuery } from '/lib/hooks/PostComment'

import PostCommentWithContext from '/components/posts/PostCommentWithContext'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import './UserAdminPostCommentView.css'

const UserAdminPostCommentView = function({ userId }) {

    const [query] = usePostCommentQuery({ userId: userId }, { admin: true })
    
    let content = ( <Spinner /> ) 
    if ( query !== null ) {
        content = []
        for(const id of query.list) {
            content.push(<PostCommentWithContext key={id} postCommentId={id} />)
        }
    }

    return (
        <div className="user-admin-post-comment-view">
            { content }
            <PaginationControls meta={query?.meta} />
        </div>
    )


}

export default UserAdminPostCommentView
