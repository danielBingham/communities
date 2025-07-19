import React from 'react'
import { useSelector } from 'react-redux'

import { useUserRelationshipQuery } from '/lib/hooks/UserRelationship'

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

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const relationshipDictionary = useSelector((state) => state.UserRelationship.dictionary)
    const [query, request] = useUserRelationshipQuery(currentUser.id, params) 

    // ======= Render ===============================================

    let content = ( <Spinner local={ true } /> )

    if ( query?.list && query?.list.length > 0 ) {
        const userBadges = []
        for( const id of query.list) {
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
            <PaginationControls meta={query?.meta} /> 
        </List>
    )
        
}

export default FriendList
