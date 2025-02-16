import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import {getUserRelationships, clearUserRelationshipQuery } from '/state/userRelationships'

import UserBadge from '/components/users/UserBadge'
import FriendButton from '/components/friends/FriendButton'

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

    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================

    const relationshipDictionary = useSelector((state) => state.userRelationships.dictionary)
    const relationships = useSelector((state) => 'FriendList' in state.userRelationships.queries ? state.userRelationships.queries['FriendList'].list : [])

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

        makeRequest(getUserRelationships('FriendList', userId, queryParams))
        return function cleanup() {
            dispatch(clearUserRelationshipQuery({ name: 'FriendList'}))
        }
    }, [ searchParams, params ])

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
                userBadges.push(<UserBadge key={relationship.userId} id={relationship.userId}>
                    <FriendButton userId={relationship.userId} />
                </UserBadge>)
            } else if ( relationship.relationId !== userId ) {
                userBadges.push(<UserBadge key={relationship.relationId} id={relationship.relationId}>
                    <FriendButton userId={relationship.relationId} />
                </UserBadge>)
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
