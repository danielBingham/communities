import React from 'react'

import { useGroupQuery } from '/lib/hooks/Group'

import GroupBadge from '/components/groups/view/GroupBadge'

import { List, ListGridContent } from '/components/generic/list/List'
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

    return (
        <List className="group-list">
            <ListGridContent>
                { groupViews }
            </ListGridContent>
            <PaginationControls meta={query.meta} />
        </List>
    )

}

export default GroupList
