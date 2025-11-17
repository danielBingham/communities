/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useSelector } from 'react-redux'

import { useUserRelationshipQuery } from '/lib/hooks/UserRelationship'

import UserBadge from '/components/users/UserBadge'
import FriendButton from '/components/friends/FriendButton'

import Spinner from '/components/Spinner'
import { 
    List, 
    ListHeader, 
    ListGridContent, 
    SearchControl
} from '/components/ui/List'
import PaginationControls from '/components/PaginationControls'
import Button from '/components/ui/Button'
import Refresher from '/components/ui/Refresher'
import Error404 from '/components/errors/Error404'
import { RequestErrorPage } from '/components/errors/RequestError'

import './FriendList.css'

const FriendList = function({ userId, params, noSearch, descriptor }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const relationshipDictionary = useSelector((state) => state.UserRelationship.dictionary)
    const [query, request, reset] = useUserRelationshipQuery(userId, params) 

    // ======= Render ===============================================

    let content = ( <Spinner /> )

    if ( query === null && ( request === null || request?.state === 'pending' )) {
        return ( <Spinner /> )
    }

    if ( request?.state === 'failed' && request.error.type === 'not-found' ) {
        return (<Error404 />)
    } else if ( request?.state === 'failed' && request.error.type === 'not-authorized' ) {
        return (
            <div className="friend-list__no-permission">
                <div>You don't have permission to view their friends.</div> 
            </div>
        )
    } else if ( request?.state === 'failed' ) {
        return (
            <RequestErrorPage id="user-profile-page" message={'Attempt to retrieve relationships'} request={request} />
        )
    }

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

    descriptor = descriptor ? descriptor : 'Friends'
    let explanation = ''
    if ( ! query || parseInt(query.meta.count) === 0 ) {
        explanation = `0 ${descriptor}`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `${pageStart} to ${pageEnd} of ${query.meta.count} ${descriptor}`
    }

    return (
        <List className="friend-list">
            <ListHeader explanation={explanation}>
                <Refresher onRefresh={() => reset()} />
                { ! noSearch && <SearchControl entity={descriptor} /> }
            </ListHeader>
            <ListGridContent>
                { content } 
            </ListGridContent>
            <PaginationControls meta={query?.meta} /> 
        </List>
    )
        
}

export default FriendList
