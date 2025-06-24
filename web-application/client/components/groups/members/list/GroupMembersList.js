import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMembers, clearGroupMemberQuery } from '/state/GroupMember'

import GroupMemberBadge from '/components/groups/members/GroupMemberBadge'
import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import './GroupMembersList.css'

const GroupMembersList = function({ groupId, params }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dictionary = useSelector((state) => state.GroupMember.dictionary)
    const queries = useSelector((state) => state.GroupMember.queries)

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

        memberViews.push(<GroupMemberBadge key={id} groupId={groupId} userId={member.userId} />)
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
