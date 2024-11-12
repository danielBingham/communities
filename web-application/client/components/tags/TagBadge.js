import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { getTag, cleanupRequest } from '/state/tags'

import Tag from './Tag'

import Spinner from '/components/Spinner'
import './TagBadge.css'

/**
 * Show a Badge for a tag.  This shows the tag, as well as the number of
 * papers in the tag and a description for it.
 *
 * TODO Show an actual number of papers, rather than a dummy.
 *
 * @param {object} props    The react props object.
 * @param {object} props.tag  The tag we want to display a badge for.
 */
const TagBadge = function(props) {

    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.tags.requests[requestId]
        }
    })

    // ======= Redux State ==========================================
    
    const tag = useSelector(function(state) {
        return state.tags.dictionary[props.id]
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! tag ) {
            setRequestId(dispatch(getTag(props.id)))
        }
    }, [ props.id ])

    /**
     * Make sure we cleanup the request on unmount.
     */
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [requestId])


    // ======= Render ===============================================
  
    let content = ( <Spinner local={true} /> )
    if ( tag ) {
        content = (
            <>
                <div className="wrapper"><Tag id={tag.id} noLink={props.noLink} target={props.target} /></div>
                <div className="description">{ tag.description }</div>
            </>
        )
    }

    return (
        <div className='tag-badge'>
            { content }
        </div>
    )
}

export default TagBadge
