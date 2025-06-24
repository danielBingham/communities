import React from 'react'
import { useUserQuery } from '/lib/hooks/User'

import UserBadge from '../UserBadge'
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

import './UserListView.css'

const UserListView = function({ params }) {
    const [query, request] = useUserQuery(params)

    // ======= Render ===============================================

    let content = ( <Spinner /> )
    let noContent = null

    if ( query !== null ) {
        const userBadges = []
        for( const userId of query.list) {
            userBadges.push(<UserBadge key={userId} id={userId}>
                <FriendButton userId={userId} />
            </UserBadge>)
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
                <PaginationControls meta={query?.meta} /> 
            </List>
        </div>
    )
        
}

export default UserListView
