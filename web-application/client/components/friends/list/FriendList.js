import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import {getUserRelationships, clearUserRelationshipQuery, cleanupRequest } from '/state/userRelationships'

import UserBadge from '/components/users/UserBadge'

import Spinner from '/components/Spinner'
import { 
    List, 
    ListHeader, 
    ListTitle, 
    ListControls, 
    ListControl, 
    ListGridContent, 
    ListNoContent 
} from '/components/generic/list/List'
import PaginationControls from '/components/PaginationControls'

import './FriendList.css'

const FriendList = function({ userId, params }) {
    const [ searchParams, setSearchParams ] = useSearchParams()
   

    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.userRelationships.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const relationshipDictionary = useSelector((state) => state.userRelationships.dictionary)
    const relationships = useSelector(function(state) {
        if ( ! state.userRelationships.queries['FriendList'] ) {
            return []
        } else {
            return state.userRelationships.queries['FriendList'].list
        }
    })

    const meta = useSelector(function(state) {
        if ( ! state.userRelationships.queries['FriendList'] ) {
            return {
                count: 0,
                page: 1,
                pageSize: 1,
                numberOfPages: 1
            }
        }
        return state.userRelationships.queries['FriendList'].meta
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    useEffect(function() {
        const queryParams = { ...params }

        queryParams.page = searchParams.get('page')
        if ( ! queryParams.page ) {
            queryParams.page = 1
        }

        setRequestId(dispatch(getUserRelationships('FriendList', userId, queryParams)))
        return function cleanup() {
            dispatch(clearUserRelationshipQuery({ name: 'FriendList'}))
        }
    }, [ searchParams, params ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    let content = ( <Spinner local={ true } /> )

    if ( relationships && relationships.length > 0 ) {
        const userBadges = []
        for( const id of relationships) {
            const relationship = relationshipDictionary[id]

            // If the relationship has been removed, it may still be in the
            // list, but won't be in the dictionary.
            if ( ! relationship ) {
                continue
            }

            if ( relationship.userId !== userId ) {
                userBadges.push(<UserBadge key={relationship.userId} id={relationship.userId} />)
            } else if ( relationship.relationId !== userId ) {
                userBadges.push(<UserBadge key={relationship.relationId} id={relationship.relationId} />)
            } else {
                console.error(`Relationship found with User(${userId}) on neither end!`)
            }
        }
        content = userBadges
    } else if (request && request.state == 'fulfilled') {
        content = null
    } 

    return (
        <List className="friend-list">
            <ListGridContent>
                { content } 
            </ListGridContent>
            <PaginationControls meta={meta} /> 
        </List>
    )
        
}

export default FriendList
