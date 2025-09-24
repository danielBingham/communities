import { useSelector } from 'react-redux'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUserRelationshipQuery } from '/lib/hooks/UserRelationship'

import { 
    GroupPermissions, useGroupPermission,
    GroupMemberPermissions, useGroupMemberPermission

} from '/lib/hooks/permission'

import Spinner from '/components/Spinner'
import { 
    List, 
    ListHeader, 
    ListGridContent, 
    SearchControl
} from '/components/ui/List'
import PaginationControls from '/components/PaginationControls'

import UserBadge from '/components/users/UserBadge'
import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import GroupMembersControls from '/components/groups/GroupMembersControls'

import './GroupInviteView.css'

const GroupInviteView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupRequest] = useGroup(groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const context = {
        group: group,
        userMember: currentMember
    }

    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, context)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, context)
    const canQueryGroupMember = useGroupMemberPermission(currentUser, GroupMemberPermissions.QUERY, context)

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
