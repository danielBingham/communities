import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMembers, clearGroupMemberQuery } from '/state/groupMembers'

import UserBadge from '/components/users/UserBadge'
import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import './GroupMembersList.css'

const GroupMembersList = function({ groupId, params }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dictionary = useSelector((state) => state.groupMembers.dictionary)
    const queries = useSelector((state) => state.groupMembers.queries)

    useEffect(() => {
        if ( ! ('GroupMembersList' in queries)) {
            const queryParams = { ...params }
            makeRequest(getGroupMembers(groupId, 'GroupMembersList', queryParams))
        }
    }, [ groupId, params, queries ])

    if ( ! ('GroupMembersList' in queries)) {
        return (
            <div className="group-members-list">
                <Spinner />
            </div>
        )
    }

    const query = queries['GroupMembersList']

    const memberViews = []
    for(const id of query.list) {
        const member = dictionary[id]

        if ( ! member ) {
            continue
        }

        memberViews.push(<UserBadge key={id} id={member.userId}>
            { currentUser.id !== member.userId && <GroupMembershipButton groupId={groupId} userId={member.userId} /> }
        </UserBadge>)
    }

    return (
        <div className="group-members-list">
            <div className="group-members-list__grid">
                {memberViews}        
            </div>
            <PaginationControls meta={query.meta} />
        </div>
    )

}

export default GroupMembersList
