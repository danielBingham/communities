import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroup } from '/state/groups'

import GroupImage from '/components/groups/view/GroupImage'
import Error404 from '/components/errors/Error404'

import './GroupView.css'

const GroupView = function(props) {

    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================
    
    const group = useSelector((state) => state.groups.dictionary[props.id])

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( ! group ) {
            makeRequest(getGroup(props.id))
        }
    }, [ group ])

    // ======= Render ===============================================

    if ( ! group && ! request ) {
        return null 
    } else if ( ! group && (request && request.state == 'pending')) {
        return null 
    } else  if ( request && request.state == 'failed' ) {
        if ( request.error.type == 'not-found' ) {
            return ( <Error404 /> )
        } else {
            return (
                <article className="group-view">
                    <div className="error">
                        <p>We encountered an error while attempting to load the group. Please report a bug.</p>
                        <p>Error type "{ request.error.type }" with message: { request.error.message }.</p>
                    </div>
                </article>
            )
        }
    } else if ( ! group && request && request.state == 'fulfilled' ) {
        return ( <Error404 /> )
    } 

    return (
        <article id={ group.id } className='group-view'>
            <GroupImage groupId={group.id} />
            <div className="details">
                <div className="title"> { group.title}</div>
                <div className="about"> { group.about }</div>
            </div>
        </article>
    )
}

export default GroupView 
