import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/Group'

import GroupBadge from '/components/groups/view/GroupBadge'

import { List, ListGridContent } from '/components/generic/list/List'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

const GroupList = function({ name, params }) {

    const query = useSelector((state) => name in state.Group.queries ? state.Group.queries[name] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        makeRequest(getGroups(name, params))
    }, [ name, params ])

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
