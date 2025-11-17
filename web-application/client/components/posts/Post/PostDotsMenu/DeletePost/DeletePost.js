import React, { useState, useEffect, useContext } from 'react'

import { TrashIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { deletePost } from '/state/Post'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

import { RequestErrorModal } from '/components/errors/RequestError'
import Spinner from '/components/Spinner'
import AreYouSure from '/components/AreYouSure'

const DeletePost = function({ postId } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)
    const closeMenu = useContext(CloseMenuContext)

    const [request, makeRequest] = useRequest()

    const executeDelete = function() {
        setAreYouSure(false)
        makeRequest(deletePost({ id: postId }))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

    return (
        <>
            <DotsMenuItem onClick={(e) => setAreYouSure(true) } className="delete"><TrashIcon /> Delete { request?.state === 'pending' ? <Spinner /> : null }</DotsMenuItem>
            <AreYouSure isVisible={areYouSure} execute={executeDelete} cancel={() => setAreYouSure(false) } > 
                <p>Are you sure you want to delete this post?</p>
            </AreYouSure>
            <RequestErrorModal message="Attempt to delete post" request={request} />
        </>
    )
}

export default DeletePost
