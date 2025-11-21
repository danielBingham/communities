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

import can, {Actions, Entities} from '/lib/permission'

import { useGroup, useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUserRelationshipQuery } from '/lib/hooks/UserRelationship'

import Spinner from '/components/Spinner'
import { 
    List, 
    ListHeader, 
    ListGridContent, 
    SearchControl
} from '/components/ui/List'
import PaginationControls from '/components/PaginationControls'

import UserBadge from '/components/users/UserBadge'
import GroupMembershipButton from '/components/groups/GroupMembershipButton'
import GroupMembersControls from '/components/groups/GroupMembersControls'

import './GroupInviteView.css'

const GroupInviteView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupRequest] = useGroup(groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    // TECHDEBT HACK: Using `group?.id` here is a hack to prevent multiple
    // requests from being fired and conflicting.
    //
    // By using `group?.id`, the useGroup* hooks in useGroupPermissionContext
    // won't fire until after the `useGroup` above returns.  This ensures that
    // the `useGroupMember` above at least has time to fire and register that a
    // request is in progress.  This keeps us from firing double requests.
    //
    // Yes, this is extremely hacky.
    const [ context, requests] = useGroupPermissionContext(currentUser, group?.id)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)
    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context)
    const canQueryGroupMember = can(currentUser, Actions.query, Entities.GroupMember, context)

    const relationshipDictionary = useSelector((state) => state.UserRelationship.dictionary)
    const [query, request] = useUserRelationshipQuery(currentUser.id, { user: { status: 'confirmed' }, GroupMember: { is: 'empty', groupId: groupId } }) 

    if ( ! canModerateGroup ) {
        return null
    }

    if ( ! group && ( ! groupRequest || groupRequest.state === 'pending' )
        || (currentMember === undefined || ( currentMemberRequest?.state === 'pending')) ) 
    {
        return ( <div className="group-members-view"><Spinner /></div> )
    }


    if ( canViewGroup !== true || canQueryGroupMember !== true ) {
        return (
            <div className="group-members-view">
                <div className="group-members-view__private">The contents of this group are private.</div>
            </div>
        )
    }

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

            if ( relationship.userId !== currentUser.id) {
                userBadges.push(<UserBadge key={relationship.userId} id={relationship.userId}>
                    <GroupMembershipButton groupId={groupId} userId={relationship.userId} />
                </UserBadge>)
            } else if ( relationship.relationId !== currentUser.id) {
                userBadges.push(<UserBadge key={relationship.relationId} id={relationship.relationId}>
                    <GroupMembershipButton groupId={groupId} userId={relationship.relationId} />
                </UserBadge>)
            } else {
                console.error(`Relationship found with User(${currentUser.id}) on neither end!`)
            }
        }
        content = userBadges
    } else if (request && request.state == 'fulfilled') {
        content = null
    } 

    let descriptor = descriptor ? descriptor : 'Friends'
    let explanation = ''
    if ( ! query || parseInt(query.meta.count) === 0 ) {
        explanation = `0 ${descriptor}`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `${pageStart} to ${pageEnd} of ${query.meta.count} ${descriptor}`
    }

    return (
        <div className="group-invite-view">
            <GroupMembersControls groupId={groupId} />
            <div className="group-invite-view__invitations">
                <List className="friend-list">
                    <ListHeader explanation={explanation}>
                        <SearchControl entity={descriptor} /> 
                    </ListHeader>
                    <ListGridContent>
                        { content } 
                    </ListGridContent>
                    <PaginationControls meta={query?.meta} /> 
                </List>
            </div>
        </div>
    )
}

export default GroupInviteView 
