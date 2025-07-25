import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useGroupMemberQuery } from '/lib/hooks/GroupMember'


import GroupMemberBadge from './GroupMemberBadge'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import './GroupMembersList.css'

const GroupMembersList = function({ groupId, params }) {

    const dictionary = useSelector((state) => state.GroupMember.dictionary)
    const [ query, request ] = useGroupMemberQuery(groupId, params)

    if ( query === undefined || query === null ) {
        return (
            <div className="group-members-list">
                <Spinner />
            </div>
        )
    }

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
