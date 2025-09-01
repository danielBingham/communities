import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useGroupMemberQuery } from '/lib/hooks/GroupMember'

import GroupMemberBadge from './GroupMemberBadge'
import { 
    List, 
    ListHeader, 
    ListGridContent, 
    SearchControl
} from '/components/ui/List'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

import './GroupMembersList.css'

const GroupMembersList = function({ groupId, params, descriptor, noSearch }) {

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

    descriptor = descriptor ? descriptor : 'Members'
    let explanation = ''
    if ( ! query || parseInt(query.meta.count) === 0 ) {
        explanation = `0 ${descriptor}`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `${pageStart} to ${pageEnd} of ${query.meta.count} ${descriptor}`
    }

    return (
        <List className="group-members-list">
            <ListHeader explanation={explanation}>
                { ! noSearch && <SearchControl entity={descriptor} /> }
            </ListHeader>
            <ListGridContent>
                {memberViews}        
            </ListGridContent>
            <PaginationControls meta={query.meta} />
        </List>
    )

}

export default GroupMembersList
