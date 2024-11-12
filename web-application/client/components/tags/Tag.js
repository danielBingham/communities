import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { XMarkIcon } from '@heroicons/react/24/outline'

import { getTag, cleanupRequest } from '/state/tags'

import Spinner from '/components/Spinner'

import './Tag.css'



/**
 * Show a tag for a tag, linking to the TagPage for this tag.  May be
 * given a `remove` function, in which case an "x" will be displayed on the
 * tag and the given `remove` function will be called when the 'x' is
 * clicked.  
 *
 * @param {object} props    The react props object.
 * @param {object} props.tag  The tag we'd like to display a tag for.
 * @param {function} props.remove   (Optional) A function to be called when the
 * "X" is clicked.  If not provided, no "X" will be displayed.
 */
const Tag = function(props) {


    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.tags.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================
    
    let tag = useSelector(function(state) {
        if ( props.id ) {
            return state.tags.dictionary[props.id]
        } else {
            return null
        }
    })

    // ======= Actions and Event Handling ===========================
   
    const dispatch = useDispatch()

    /**
     * The "x" has been clicked, call remove. 
     */
    const remove = function(event) {
        event.preventDefault()
        event.stopPropagation()
        props.remove(tag)
    }

    useEffect(function() {
        if ( ! tag && props.id ) {
            setRequestId(dispatch(getTag(props.id)))
        } else if ( ! tag ) {
            throw new Error ('Need a tag to display a tag!')
        }
    }, [ props.id ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId}))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    if ( ! tag && props.id ) {
        return (<div className='tag'> <Spinner local={true} /></div> )
    }

    // Generate the tag tag background colors.
    const types = tag.type.split(':')

    let content = (
        <a href={ `/tag/${tag.id}` } target={props.target ? props.target : "_self"} >
            {tag.name}
        </a>

    )
    if ( props.noLink ) {
        content =  ( <span>{ tag.name }</span> )
    }
    
    return (
        <div className="tag" >
            { content }
            { props.remove &&  <div className="remove" onClick={remove}><XMarkIcon /></div> }
        </div>
    )
}

export default Tag 
