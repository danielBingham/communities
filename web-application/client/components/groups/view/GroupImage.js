import React from 'react'
import {  useSelector } from 'react-redux'

import logger from '/logger'

import { UserGroupIcon } from '@heroicons/react/24/solid'

import './GroupImage.css'

const GroupImage = function({ groupId, className }) {
    
    // ======= Request Tracking =====================================
    

    // ======= Redux State ==========================================
    
    const group = useSelector((state) => groupId && groupId in state.groups.dictionary ? state.groups.dictionary[groupId] : null)
    const configuration = useSelector((state) => state.system.configuration)

    // ======= Effect Handling ======================================
    

    // ======= Render ===============================================

    let content = ( <UserGroupIcon /> ) 
    if ( group && group.fileId ) {
        content = (
            <img src={`${configuration.backend}/file/${group.fileId}`} />
        )
    } 

    return (
        <div className={ className ? `group-image ${className}` : "group-image"}>
            {content}
        </div>
    )

}

export default GroupImage
