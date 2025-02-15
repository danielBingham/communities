import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

import GroupBadge from '/components/groups/view/GroupBadge'

import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'

const GroupList = function({ name, params }) {

    const query = useSelector((state) => name in state.groups.queries ? state.groups.queries[name] : null)

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
        <div className="group-list">
            { groupViews }
            <PaginationControls meta={query.meta} />
        </div>
    )

}

export default GroupList
