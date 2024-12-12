import React from 'react'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

const EditPost = function({ postId }) {

    const executeEdit = function() {
        let editing = JSON.parse(localStorage.getItem('editing'))
        if ( editing !== null ) {
            editing[postId] = true
        } else {
            editing = { 
                [postId]: true
            }
        }
        localStorage.setItem('editing', JSON.stringify(editing))
    }

    return (
        <FloatingMenuItem onClick={executeEdit} className="edit">edit</FloatingMenuItem> 
    )

}

export default EditPost 
