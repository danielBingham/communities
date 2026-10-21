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

/**
 * Get the CommentReactions on a PostComment that we have in state.
 *
 * `PostComment.reactions` can include reactions from users who are blocked
 * by, or have blocked, the current user.  The backend never sends us those
 * reactions, so we only use the ones we actually have.
 *
 * This doesn't query.  The reactions arrive as relations of the PostComment.
 *
 * @param {string} commentId The id of the PostComment.
 *
 * @returns {object} `comment`: the PostComment, or null if we don't have it;
 * `likes`: the 'like' CommentReactions on it; and `userReaction`: the current
 * user's CommentReaction on it, or null if they haven't reacted.
 */
export const useCommentReactions = function(commentId) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const comment = useSelector((state) => commentId && commentId in state.PostComment.dictionary ? state.PostComment.dictionary[commentId] : null)
    const commentReactions = useSelector((state) => state.CommentReaction.dictionary)

    const likes = []
    let userReaction = null
    for(const reactionId of (comment?.reactions ?? [])) {
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

    return { comment, likes, userReaction }
}
