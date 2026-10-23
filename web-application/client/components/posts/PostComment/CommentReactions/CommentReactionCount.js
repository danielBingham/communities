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

import { useCommentReactions } from '/lib/hooks/CommentReaction'

import { HandThumbUpIcon } from '@heroicons/react/16/solid'

import UserTag from '/components/users/UserTag'

import Modal from '/components/generic/modal/Modal'

import './CommentReactions.css'

/**
 * The number of likes on a PostComment, with a filled thumbs up.  Clicking it
 * opens a modal listing who liked the comment.  Renders nothing when the
 * comment has no likes.
 *
 * @param {object} props
 * @param {string} props.commentId The id of the PostComment.
 */
const CommentReactionCount = function({ commentId }) {
    const [showReactions, setShowReactions] = useState(false)

    const { likes } = useCommentReactions(commentId)

    if ( likes.length <= 0 ) {
        return null
    }

    const likeViews = likes.map((reaction) => (
        <div key={reaction.id}><HandThumbUpIcon className="reaction" aria-hidden="true" /><UserTag id={reaction.userId} /></div>
    ))

    return (
        <>
            <Modal isVisible={showReactions} setIsVisible={setShowReactions} className="comment-reactions__detail-modal">
                <div className="comment-reactions__detail">
                    { likeViews }
                </div>
            </Modal>
            <a
                href=""
                role="button"
                aria-haspopup="dialog"
                aria-label={`View ${likes.length} ${likes.length === 1 ? 'like' : 'likes'}`}
                className="comment-reactions__count"
                onClick={(e) => { e.preventDefault(); setShowReactions(true) }}
            >{ likes.length } <HandThumbUpIcon aria-hidden="true" /></a>
        </>
    )
}

export default CommentReactionCount
