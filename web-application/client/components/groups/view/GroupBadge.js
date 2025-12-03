import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { getGroup } from '/state/Group'

import GroupImage from '/components/groups/view/GroupImage'

import { ListGridContentItem } from '/components/ui/List'

import './GroupBadge.css'

const GroupBadge = function({ id }) {
    
    const hasRules = useFeature('issue-330-group-short-description-and-rules')

    // ======= Request Tracking =====================================
   
    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================
    
    const group = useSelector((state) => id in state.Group.dictionary ? state.Group.dictionary[id] : null)

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( ! group ) {
            makeRequest(getGroup(id))
        }
    }, [ group ])

    // ======= Render ===============================================
    if( ! group && ( ! request || request.status == 'pending' )) {
        return null 
    }

    if ( group ) {
        return (
            <ListGridContentItem className="group-badge">
                <div className="group-badge__grid">
                    <GroupImage groupId={group.id} />
                    <div className="group-badge__details" >
                        <div className="group-badge__title"><Link to={ `/group/${group.slug}` }>{group.title}</Link></div>
                        { ! hasRules && <div className="group-badge__about">{ group.about?.length > 100 ? group.about.substring(0,100).trim()+'...' : group.about }</div> }
                        { hasRules && <div className="group-badge__about">{ group.shortDescription }</div> }
                    </div> 
                </div>
            </ListGridContentItem>
        )
    } else {
        return (null)
    }

}

export default GroupBadge 
