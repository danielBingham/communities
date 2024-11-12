import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { postPostReactions, cleanupRequest } from '/state/posts'

import { XCircleIcon, 
    HandThumbUpIcon, 
    HandThumbDownIcon,
    ArrowPathRoundedSquareIcon
} from '@heroicons/react/16/solid'

const PostReactions = function({ postId }) {
    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.posts.requests ) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const post = useSelector(function(state) {
        if ( postId in state.posts.dictionary ) {
            return state.posts.dictionary[postId]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()

    const react = function(reaction) {

        const reactionEntity = {
            postId: postId,
            reaction: reaction
        }

        setRequestId(dispatch(postPostReactions(reactionEntity)))
    }

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    const reactionCounts = {}
    for( const reaction of post.reactions) {
        if ( ! ( reaction.reaction in reactionCounts ) ) {
            reactionCounts[reaction.reaction] = 1
        } else {
            reactionCounts[reaction.reaction] += 1
        }
    }

    return (
        <div className="reactions">
            <div className="group positive">
                <a href=""
                    onClick={(e) => { e.preventDefault(); react('like') }} 
                ><HandThumbUpIcon /> Like { 'like' in reactionCounts ? `(${reactionCounts['like'] })` : '' }</a>
            </div>
            <div className="group negative">
                <a href=""
                    onClick={(e) => { e.preventDefault(); react('dislike') }} 
                ><HandThumbDownIcon /> Dislike { 'dislike' in reactionCounts ? `(${reactionCounts['dislike']})` : '' }</a>
            </div>
            <div className="group share">
                <a href=""><ArrowPathRoundedSquareIcon /> Share</a>
            </div>
            <div className="group block">
                <a href=""
                    onClick={(e) => { e.preventDefault(); react('block') }} 
                ><XCircleIcon /> Block { 'block' in reactionCounts ? `(${reactionCounts['block']})` : '' }</a>
            </div>
        </div>
    )

}

export default PostReactions
