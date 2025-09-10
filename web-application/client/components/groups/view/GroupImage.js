import React from 'react'
import {  useSelector } from 'react-redux'

import logger from '/logger'

import { UserGroupIcon } from '@heroicons/react/24/solid'

import Image from '/components/ui/Image'

import './GroupImage.css'

const GroupImage = function({ groupId, className, width }) {
    
    // ======= Request Tracking =====================================
    

    // ======= Redux State ==========================================
    
    const group = useSelector((state) => groupId && groupId in state.Group.dictionary ? state.Group.dictionary[groupId] : null)
    const configuration = useSelector((state) => state.system.configuration)

    // ======= Effect Handling ======================================
    

    // ======= Render ===============================================

    const renderWidth = width ? width : 200
    let content = ( <UserGroupIcon /> ) 
    if ( group && group.fileId ) {
        content = (
            <Image id={group.fileId} width={renderWidth} />
        )
    } 

    return (
        <div className={ className ? `group-image ${className}` : "group-image"}>
            {content}
        </div>
    )

}

export default GroupImage
