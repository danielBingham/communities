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
import { useNavigate, useLocation } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { postPostReaction, patchPostReaction, deletePostReaction } from '/state/PostReaction'

import { 
    NoSymbolIcon, 
    HandThumbUpIcon, 
    HandThumbDownIcon,
    ArrowPathRoundedSquareIcon
} from '@heroicons/react/16/solid'


import UserTag from '/components/users/UserTag'

import Modal from '/components/generic/modal/Modal'

import './PostReactions.css'

const PostReactions = function({ postId }) {

    const [showReactions, setShowReactions] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null)

    const postReactions = useSelector((state) => state.PostReaction.dictionary)
    const userReactionId = post.reactions.find((rid) => rid in postReactions ? postReactions[rid].userId == currentUser?.id : false)
    const userReaction = userReactionId ? postReactions[userReactionId] : null

    const navigate = useNavigate()
    const location = useLocation()

    const react = function(reaction) {
        if ( request && request.state == 'pending' ) {
            return
        }

        const reactionEntity = {
            postId: postId,
            reaction: reaction
        }

        if ( ! userReaction ) {
            makeRequest(postPostReaction(reactionEntity))
        } else if (reaction != userReaction.reaction ) {
            makeRequest(patchPostReaction(reactionEntity))
        } else {
            makeRequest(deletePostReaction({ postId: postId }))
        }
    }

    const sharePost = function() {
        let sharedPostId = post && post.sharedPostId ? post.sharedPostId : postId
        navigate(`/create?sharedPostId=${sharedPostId}&origin=${encodeURIComponent(location.pathname)}`)
    }

    if ( ! post ) {
        return null
    }

    const reactionViews = []
    const reactionCounts = {}
    for( const reactionId of post.reactions) {
        if ( ! (reactionId in postReactions)) {
            continue 
        }

        const reaction = postReactions[reactionId]
        if ( ! ( reaction.reaction in reactionCounts ) ) {
            reactionCounts[reaction.reaction] = 1
        } else {
            reactionCounts[reaction.reaction] += 1
        }

        if ( reaction.reaction == 'like' ) {
            reactionViews.push(
                <div key={reaction.userId}><HandThumbUpIcon className="reaction" /><UserTag id={reaction.userId} /></div>
            )
        } else if ( reaction.reaction == 'dislike' ) {
            reactionViews.push(
                <div key={reaction.userId}><HandThumbDownIcon className="reaction" /><UserTag id={reaction.userId} /></div>
            )
        } else if ( reaction.reaction == 'block' ) {
            reactionViews.push(
                <div key={reaction.userId}><NoSymbolIcon className="reaction block" /><UserTag id={reaction.userId} /></div>
            )
        }
    }

    return (
        <div className="reactions">
            <Modal isVisible={showReactions} setIsVisible={setShowReactions} className="reactions__detail-modal">
                <div className="reactions__detail">
                    { reactionViews }
                </div>
            </Modal>
            { reactionViews.length > 0 && <div className="reactions__view">
                <a href="" role="button" aria-haspopup="dialog" aria-label="View reactions" onClick={(e) => { e.preventDefault(); setShowReactions(true)}}>{ 'like' in reactionCounts && <span><HandThumbUpIcon /> {reactionCounts['like']}</span> }
                { 'dislike' in reactionCounts && <span><HandThumbDownIcon /> {reactionCounts['dislike']}</span> }
                    { 'block' in reactionCounts && <span className="block"><NoSymbolIcon/> {reactionCounts['block']}</span>}</a>
            </div> }
            <div className="reactions__controls">
                <div className="group positive">
                    <a href=""
                        role="button"
                        aria-pressed={ userReaction?.reaction == 'like' }
                        className={`${ userReaction?.reaction == 'like' ? 'reacted' : ''} like`}
                        onClick={(e) => { e.preventDefault(); react('like') }} 
                    ><HandThumbUpIcon /> Like </a>
                </div>
                <div className="group negative">
                    <a href=""
                        role="button"
                        aria-pressed={ userReaction?.reaction == 'dislike' }
                        className={`${ userReaction?.reaction == 'dislike' ? 'reacted' : ''} dislike`}
                        onClick={(e) => { e.preventDefault(); react('dislike') }} 
                    ><HandThumbDownIcon /> Dislike</a>
                </div>
                { (post.visibility === 'public' || post.sharedPostId) && <div className="group share">
                    <a href="" onClick={(e) => { e.preventDefault(); sharePost() }} ><ArrowPathRoundedSquareIcon /> Share</a>
                </div> }
            </div>
        </div>
    )

}

export default PostReactions
