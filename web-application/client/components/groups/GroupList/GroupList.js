import React from 'react'

import { useGroupQuery } from '/lib/hooks/Group'

import GroupBadge from '/components/groups/view/GroupBadge'

import { List, ListHeader, ListGridContent, SearchControl } from '/components/ui/List'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

const GroupList = function({ params }) {
    const [query, request] = useGroupQuery(params)

    if ( ! query ) {
        return (
            <div className="group-list">
                <Spinner />
            </div>
        )
    }

    const groupViews = []
    for(const id of query.list) {
        groupViews.push(<GroupBadge key={id} id={id} />)
    }

    let explanation = ''
    if ( ! query || parseInt(query.meta.count) === 0 ) {
        explanation = `0 Groups`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `${pageStart} to ${pageEnd} of ${query.meta.count} Groups`
    }

    return (
        <List className="group-list">
            <ListHeader explanation={explanation}><SearchControl entity="Groups" /></ListHeader>
            <ListGridContent>
                { groupViews }
            </ListGridContent>
            <PaginationControls meta={query.meta} />
        </List>
    )

}

export default GroupList
