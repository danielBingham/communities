import React, { useState, useEffect, useContext } from 'react'

import { TrashIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { deletePostComment } from '/state/PostComment'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import { RequestErrorModal } from '/components/errors/RequestError'

import AreYouSure from '/components/AreYouSure'

import './DeletePostComment.css'

const DeletePostComment = function({ postId, id } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [request, makeRequest] = useRequest()

    const closeMenu = useContext(CloseMenuContext)

    const deleteComment = function() {
        setAreYouSure(false)
        makeRequest(deletePostComment({ postId: postId, id: id }))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])


    return (
        <>
            <DotsMenuItem onClick={(e) => setAreYouSure(true)} className="delete"><TrashIcon /> delete</DotsMenuItem>
            <AreYouSure isVisible={areYouSure} execute={deleteComment} cancel={() => setAreYouSure(false)}> 
                <p>Are you sure you want to delete this comment?</p>
            </AreYouSure>
            <RequestErrorModal message="Attempt to delete comment" request={request} />
        </>
    )
}

export default DeletePostComment
