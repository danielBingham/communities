import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMembers, clearGroupMemberQuery } from '/state/groupMembers'

import UserBadge from '/components/users/UserBadge'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import './GroupMembersList.css'

const GroupMembersList = function({ groupId, params }) {

    const [request, makeRequest] = useRequest()

    const dictionary = useSelector((state) => state.groupMembers.dictionary)
    const query = useSelector((state) => 'GroupMembersList' in state.groupMembers.queries ? state.groupMembers.queries['GroupMembersList'] : null)

    const dispatch = useDispatch()
    useEffect(() => {
        const queryParams = { ...params }
        makeRequest(getGroupMembers(groupId, 'GroupMembersList', queryParams))

        return () => {
            dispatch(clearGroupMemberQuery({ name: 'GroupMembersList'})) 
        }
    }, [ groupId, params ])

    if ( query === null ) {
        return (
            <div className="group-members-list">
                <Spinner />
            </div>
        )
    }

    const memberViews = []
    for(const id of query.list) {
        const member = dictionary[id]

        memberViews.push(<UserBadge key={id} id={member.userId} />)
    }

    return (
        <div className="group-members-list">
            {memberViews}        
            <PaginationControls meta={query.meta} />
        </div>
    )

}

export default GroupMembersList
