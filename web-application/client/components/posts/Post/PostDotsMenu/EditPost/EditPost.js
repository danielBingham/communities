import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

import { PencilIcon } from '@heroicons/react/24/outline'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

const EditPost = function({ postId }) {
    const closeMenu = useContext(CloseMenuContext)
    const navigate = useNavigate()
    const location = useLocation()

    const post = useSelector((state) => postId in state.Post.dictionary ? state.Post.dictionary[postId] : null)

    const startEdit = function() {
        closeMenu()
        navigate(`/create?postId=${postId}&origin=${encodeURIComponent(location.pathname)}`)
    }

    return (
        <DotsMenuItem onClick={() => startEdit()} className="edit"><PencilIcon /> Edit</DotsMenuItem> 
    )

}

export default EditPost 
