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

import { DotsMenu } from '/components/ui/DotsMenu'

import CopyPostLink from './CopyPostLink'
import SubscribeToPost from './SubscribeToPost/SubscribeToPost'
import EditPost from './EditPost/EditPost'
import DeletePost from './DeletePost/DeletePost'
import FlagPost from './FlagPost/FlagPost'
import FlagPostForGroup from './FlagPostForGroup/FlagPostForGroup'

import './PostDotsMenu.css'

const PostDotsMenu = function({ postId }) {
    const appBuild = useSelector((state) => state.system.appBuild)
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null) 

    // Must have a user and a post to show dots menu.
    if ( ! currentUser || post === null ) {
        return null
    }

    const isAuthor = currentUser && currentUser.id == post.userId

    return (
        <DotsMenu className="post-dots-menu">
            { currentUser && ( ! isNativePlatform() || appBuild >= 15) && <CopyPostLink postId={postId} /> }
            { currentUser && <SubscribeToPost postId={postId} /> }
            { currentUser && <FlagPost postId={postId} /> }
            { currentUser && post.groupId && <FlagPostForGroup postId={postId} /> }
            { isAuthor && <EditPost postId={postId} /> }
            { isAuthor && <DeletePost postId={postId} /> }
        </DotsMenu>
    )
}

export default PostDotsMenu
