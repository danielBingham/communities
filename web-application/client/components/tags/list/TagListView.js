import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { TagIcon } from '@heroicons/react/24/outline'

import TagBadge from '../TagBadge'
import { getTags, clearTagQuery, cleanupRequest } from '/state/tags'

import Spinner from '/components/Spinner'
import PaginationControls from '/components/PaginationControls'

import './TagListView.css'

/**
 * Display a tag cloud of Tags with a header.  Optionally takes a tag.id in
 * props, in which case it displays only the direct children of the tag with
 * that id. If no id is passed, displays the top level tags (tags with no
 * parents).
 *
 * @param {object} props    The react props of this component.
 * @param {int} props.id    The id of the tag who's children we want to
 * display. 
 */
const TagListView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

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
    const title = props.title ? props.title : 'Interests' 

    const tags = useSelector(function(state) {
        if ( ! state.tags.queries[title] ) {
            return []
        }

        const tags = []
        for ( const tag of state.tags.queries[title].list) {
            if ( state.tags.dictionary[tag.id] ) {
                tags.push(state.tags.dictionary[tag.id])
            }
        }
        return tags
    })

    const meta = useSelector(function(state) {
        if ( ! state.tags.queries[title] ) {
            return {
                count: 0,
                page: 1,
                pageSize: 1,
                numberOfPages: 1
            }
        }
        return state.tags.queries[title].meta 
    })

    // ======= Effect Handling ======================================
    const dispatch = useDispatch()

    // Make the request to get the tags. We only need to do this on mount.
    useEffect(function() {
        const params = { }

        const page = searchParams.get(`${title}-page`)
        if ( page ) {
            params.page = page
        }

        setRequestId(dispatch(getTags(title, params)))
            
            
    }, [ props.parent, props.child, searchParams ])

    // Cleanup when we're done, or any time we make a new request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================


    // Wait for the request to finish before displaying.  That ensures we don't
    // flicker with partial data.
    let content = ( <Spinner /> ) 
    let noContent = null
    if (request && request.state == 'fulfilled') {
        content = []
        if ( tags ) {
            for ( const tag of tags)  {
                content.push(<TagBadge key={tag.id} id={tag.id} target="_self" />)
            }
        }
        if ( content.length == 0) {
            content = null
            noContent = ( <div className="empty-list">No tags found.</div> )
        }
    } else if ( (request && request.state == 'failed') ) {
        content = null
        noContent = ( <div className="error">Request for tags failed with error: { request.error }. Please report this as a bug.</div> )
    }

    return (
        <div className="tag-list-view">
            <div className="header"><h2><TagIcon />{title }</h2></div>
            <div className="content">
                {content}
            </div>
        </div>
    )
}

export default TagListView

