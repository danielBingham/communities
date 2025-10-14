import { useSelector } from 'react-redux'

import { DotsMenu } from '/components/ui/DotsMenu'

import SubscribeToPost from './SubscribeToPost/SubscribeToPost'
import EditPost from './EditPost/EditPost'
import DeletePost from './DeletePost/DeletePost'
import FlagPost from './FlagPost/FlagPost'
import FlagPostForGroup from './FlagPostForGroup/FlagPostForGroup'

import './PostDotsMenu.css'

const PostDotsMenu = function({ postId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null) 

    // Must have a user and a post to show dots menu.
    if ( ! currentUser || post === null ) {
        return null
    }

    const isAuthor = currentUser && currentUser.id == post.userId

    return (
        <DotsMenu className="post-dots-menu">
            { currentUser && <SubscribeToPost postId={postId} /> }
            { currentUser && <FlagPost postId={postId} /> }
            { currentUser && post.groupId && <FlagPostForGroup postId={postId} /> }
            { isAuthor && <EditPost postId={postId} /> }
            { isAuthor && <DeletePost postId={postId} /> }
        </DotsMenu>
    )
}

export default PostDotsMenu
