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
import { useSelector } from 'react-redux'

import { isNativePlatform } from '/lib/native'
import { usePostComment } from '/lib/hooks/PostComment'

import { DotsMenu } from '/components/ui/DotsMenu'

import CopyPostCommentLink from './CopyPostCommentLink'
import EditPostComment from './EditPostComment'
import DeletePostComment from './DeletePostComment'
import FlagPostComment from './FlagPostComment'
import FlagPostCommentForGroup from './FlagPostCommentForGroup'

import './PostCommentDotsMenu.css'

const PostCommentDotsMenu = function({ postId, id }) {

    const appBuild = useSelector((state) => state.system.appBuild)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [comment] = usePostComment(postId, id)

    // Only logged in users can see the dots menu.
    if ( ! currentUser || comment === null ) {
        return null
    }

    return (
        <DotsMenu className="post-comment-dots-menu">
            { ( ! isNativePlatform() || appBuild >= 15 ) && <CopyPostCommentLink postId={postId} id={id} /> }
            <FlagPostComment postId={postId} id={id} />
            <FlagPostCommentForGroup postId={postId} postCommentId={id} />
            { currentUser.id === comment.userId && <EditPostComment postId={postId} id={id} /> }
            { currentUser.id === comment.userId && <DeletePostComment postId={postId} id={id} /> }
        </DotsMenu>
    )
}

export default PostCommentDotsMenu
