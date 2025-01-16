import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { postPostReaction, patchPostReaction, deletePostReaction, cleanupRequest } from '/state/postReactions'

import { XCircleIcon, 
    HandThumbUpIcon, 
    HandThumbDownIcon,
    ArrowPathRoundedSquareIcon
} from '@heroicons/react/16/solid'

import UserTag from '/components/users/UserTag'
import BlockConfirmation from '/components/posts/widgets/BlockConfirmation'

import Modal from '/components/generic/modal/Modal'
import Spinner from '/components/Spinner'

import './PostReactions.css'

const PostReactions = function({ postId }) {

    const [showReactions, setShowReactions] = useState(false)
    const [blockConfirmation, setBlockConfirmation] = useState(false)

    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.postReactions.requests ) {
            return state.postReactions.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const post = useSelector(function(state) {
        if ( postId in state.posts.dictionary ) {
            return state.posts.dictionary[postId]
        } else {
            return null
        }
    })

    const postReactions = useSelector(function(state) {
        return state.postReactions.dictionary
    })

    const userReactionId = post.reactions.find((rid) => postReactions[rid].userId == currentUser?.id)
    const userReaction = postReactions[userReactionId]

    const dispatch = useDispatch()

    const react = function(reaction) {
        const reactionEntity = {
            postId: postId,
            reaction: reaction
        }

        if ( ! userReaction ) {
            setRequestId(dispatch(postPostReaction(reactionEntity)))
        } else if (reaction != userReaction.reaction ) {
            setRequestId(dispatch(patchPostReaction(reactionEntity)))
        } else {
            setRequestId(dispatch(deletePostReaction({ postId: postId })))
        }
        
    }

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    const reactionViews = []
    const reactionCounts = {}
    for( const reactionId of post.reactions) {
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
                <div key={reaction.userId}><XCircleIcon className="reaction block" /><UserTag id={reaction.userId} /></div>
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
            { post.reactions.length > 0 && <div className="reactions__view">
                <a href="" onClick={(e) => { e.preventDefault(); setShowReactions(true)}}>{ 'like' in reactionCounts && <span><HandThumbUpIcon /> {reactionCounts['like']}</span> }
                { 'dislike' in reactionCounts && <span><HandThumbDownIcon /> {reactionCounts['dislike']}</span> }
                    { 'block' in reactionCounts && <span className="block"><XCircleIcon /> {reactionCounts['block']}</span>}</a>
            </div> }
            <div className="reactions__controls">
                <div className="group positive">
                    <a href=""
                        className={`${ userReaction?.reaction == 'like' ? 'reacted' : ''} like`}
                        onClick={(e) => { e.preventDefault(); react('like') }} 
                    ><HandThumbUpIcon /> Like </a>
                </div>
                <div className="group negative">
                    <a href=""
                        className={`${ userReaction?.reaction == 'dislike' ? 'reacted' : ''} dislike`}
                        onClick={(e) => { e.preventDefault(); react('dislike') }} 
                    ><HandThumbDownIcon /> Dislike</a>
                </div>
                {/*<div className="group share">
                    <a href=""><ArrowPathRoundedSquareIcon /> Share</a>
                </div>*/}
                <div className="group block">
                    { userReaction?.reaction != 'block' && <>
                        <a href=""
                            className={`${ userReaction?.reaction == 'block' ? 'reacted' : ''} block`}
                            onClick={(e) => { e.preventDefault(); setBlockConfirmation(true) }} 
                        ><XCircleIcon /> Block </a>
                        <BlockConfirmation
                            isVisible={blockConfirmation} 
                            execute={() => { setBlockConfirmation(false); react('block') }} 
                            cancel={() => setBlockConfirmation(false)} 
                        />
                    </>}
                    { userReaction?.reaction == 'block' && 
                        <a href=""
                            className={`${ userReaction?.reaction == 'block' ? 'reacted' : ''} block`}
                            onClick={(e) => { e.preventDefault(); react('block') }} 
                        ><XCircleIcon /> Block </a>}
                </div>
            </div>
        </div>
    )

}

export default PostReactions
