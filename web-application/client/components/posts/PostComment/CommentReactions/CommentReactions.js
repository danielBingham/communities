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
import { useState } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { postCommentReaction, deleteCommentReaction } from '/state/CommentReaction'

import { HandThumbUpIcon as HandThumbUpOutlineIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon } from '@heroicons/react/16/solid'

import UserTag from '/components/users/UserTag'

import Modal from '/components/generic/modal/Modal'

import './CommentReactions.css'

/**
 * The like count and like button for a PostComment.
 *
 * Shows the number of likes (with a filled thumbs up), which opens a modal
 * listing who liked the comment, followed by a thumbs up button that likes the
 * comment, or removes the current user's like if they've already liked it.
 *
 * @param {object} props
 * @param {string} props.postId The id of the Post the comment is on.
 * @param {string} props.commentId The id of the PostComment.
 */
const CommentReactions = function({ postId, commentId }) {
    const [showReactions, setShowReactions] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const comment = useSelector((state) => commentId && commentId in state.PostComment.dictionary ? state.PostComment.dictionary[commentId] : null)
    const commentReactions = useSelector((state) => state.CommentReaction.dictionary)

    if ( ! comment ) {
        return null
    }

    // `comment.reactions` can include reactions from users who are blocked by,
    // or have blocked, the current user.  The backend never sends us those
    // reactions, so we only count the ones we actually have.
    const likes = []
    let userReaction = null
    for(const reactionId of (comment.reactions ?? [])) {
        const reaction = commentReactions[reactionId]
        if ( ! reaction ) {
            continue
        }

        if ( reaction.reaction === 'like' ) {
            likes.push(reaction)
        }

        if ( currentUser && reaction.userId === currentUser.id ) {
            userReaction = reaction
        }
    }

    const toggleLike = function() {
        if ( ! currentUser || request?.state === 'pending' ) {
            return
        }

        if ( userReaction ) {
            makeRequest(deleteCommentReaction({ postId: postId, commentId: commentId }))
        } else {
            makeRequest(postCommentReaction({ postId: postId, commentId: commentId, reaction: 'like' }))
        }
    }

    const liked = userReaction?.reaction === 'like'

    const likeViews = likes.map((reaction) => (
        <div key={reaction.id}><HandThumbUpIcon className="reaction" aria-hidden="true" /><UserTag id={reaction.userId} /></div>
    ))

    return (
        <div className="comment-reactions">
            <Modal isVisible={showReactions} setIsVisible={setShowReactions} className="comment-reactions__detail-modal">
                <div className="comment-reactions__detail">
                    { likeViews }
                </div>
            </Modal>
            { likes.length > 0 && <a
                href=""
                role="button"
                aria-haspopup="dialog"
                aria-label={`View ${likes.length} ${likes.length === 1 ? 'like' : 'likes'}`}
                className="comment-reactions__count"
                onClick={(e) => { e.preventDefault(); setShowReactions(true) }}
            >{ likes.length } <HandThumbUpIcon aria-hidden="true" /></a> }
            <a
                href=""
                role="button"
                aria-pressed={liked}
                aria-label={ liked ? 'Unlike comment' : 'Like comment' }
                className={`comment-reactions__like ${ liked ? 'reacted' : ''}`}
                onClick={(e) => { e.preventDefault(); toggleLike() }}
            >{ liked ? <HandThumbUpIcon aria-hidden="true" /> : <HandThumbUpOutlineIcon aria-hidden="true" /> }</a>
        </div>
    )
}

export default CommentReactions
