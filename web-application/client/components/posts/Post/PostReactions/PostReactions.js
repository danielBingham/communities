import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { setSharingPost } from '/state/Post'
import { postPostReaction, patchPostReaction, deletePostReaction } from '/state/PostReaction'

import { 
    NoSymbolIcon, 
    HandThumbUpIcon, 
    HandThumbDownIcon,
    ArrowPathRoundedSquareIcon
} from '@heroicons/react/16/solid'


import UserTag from '/components/users/UserTag'
import BlockConfirmation from './BlockConfirmation'

import Modal from '/components/generic/modal/Modal'

import './PostReactions.css'

const PostReactions = function({ postId }) {

    const [showReactions, setShowReactions] = useState(false)
    const [blockConfirmation, setBlockConfirmation] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null)

    const postReactions = useSelector((state) => state.PostReaction.dictionary)
    const userReactionId = post.reactions.find((rid) => rid in postReactions ? postReactions[rid].userId == currentUser?.id : false)
    const userReaction = userReactionId ? postReactions[userReactionId] : null

    const dispatch = useDispatch()

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
        if ( post && post.sharedPostId ) {
            dispatch(setSharingPost(post.sharedPostId))
        } else {
            dispatch(setSharingPost(postId))
        }
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
                <a href="" onClick={(e) => { e.preventDefault(); setShowReactions(true)}}>{ 'like' in reactionCounts && <span><HandThumbUpIcon /> {reactionCounts['like']}</span> }
                { 'dislike' in reactionCounts && <span><HandThumbDownIcon /> {reactionCounts['dislike']}</span> }
                    { 'block' in reactionCounts && <span className="block"><NoSymbolIcon/> {reactionCounts['block']}</span>}</a>
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
                { (post.visibility === 'public' || post.sharedPostId) && <div className="group share">
                    <a href="" onClick={(e) => { e.preventDefault(); sharePost() }} ><ArrowPathRoundedSquareIcon /> Share</a>
                </div> }
                <div className="group block">
                    { userReaction?.reaction != 'block' && <>
                        <a href=""
                            className={`${ userReaction?.reaction == 'block' ? 'reacted' : ''} block`}
                            onClick={(e) => { e.preventDefault(); setBlockConfirmation(true) }} 
                        ><NoSymbolIcon/> Demote</a>
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
                        ><NoSymbolIcon/> Demote</a>}
                </div>
            </div>
        </div>
    )

}

export default PostReactions
