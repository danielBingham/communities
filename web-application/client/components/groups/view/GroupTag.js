import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroup } from '/state/groups'

import GroupImage from '/components/groups/view/GroupImage'
import './GroupTag.css'

const GroupTag = function({ id }) {

    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================
    
    const group = useSelector((state) => id in state.groups.dictionary ? state.groups.dictionary[id] : null) 

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( ! group ) {
            makeRequest(getGroup(id))
        }
    }, [ group ])

    // ======= Render ===============================================

    return (
        <span className="group-tag" >
            { group && <span><GroupImage groupId={group.id} /> <Link to={`/group/${group.slug}`}>{group.title}</Link></span> }
        </span> 
    )

}

export default GroupTag
