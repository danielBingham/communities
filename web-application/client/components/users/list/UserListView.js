import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import {getUsers, clearUserQuery, cleanupRequest } from '/state/users'

import UserBadge from '../UserBadge'

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

import './UserListView.css'

const UserListView = function({ params }) {
    const [ searchParams, setSearchParams ] = useSearchParams()
   

    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const userDictionary = useSelector((state) => state.users.dictionary)
    const users = useSelector(function(state) {
        if ( ! state.users.queries['UserList'] ) {
            return []
        } else {
            return state.users.queries['UserList'].list
        }
    })

    const meta = useSelector(function(state) {
        if ( ! state.users.queries['UserList'] ) {
            return {
                count: 0,
                page: 1,
                pageSize: 1,
                numberOfPages: 1
            }
        }
        return state.users.queries['UserList'].meta
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    useEffect(function() {
        const queryParams = { ...params }

        queryParams.page = searchParams.get('page')
        if ( ! queryParams.page ) {
            queryParams.page = 1
        }

        if ( searchParams.get('q') ) {
            queryParams.name = searchParams.get('q')
        }

        setRequestId(dispatch(getUsers('UserList', queryParams)))
        return function cleanup() {
            dispatch(clearUserQuery({ name: 'UserList'}))
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
    let noContent = null

    if ( users ) {
        const userBadges = []
        for( const userId of users) {
            userBadges.push(<UserBadge key={userId} id={userId} />)
        }
        content = userBadges
    } else if (request && request.state == 'fulfilled') {
        content = null
        noContent = (<span>No users found.</span>)
    } 

    return (
        <div className="user-list-view">
            <List className="user-list">
                <ListGridContent>
                    { content } 
                </ListGridContent>
                <PaginationControls meta={meta} /> 
            </List>
        </div>
    )
        
}

export default UserListView
