import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { UserGroupIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

const GroupFeedMenu = function() {

    const [request, makeRequest] = useRequest()

    const groupDictionary = useSelector((state) => state.groups.dictionary)
    const groups = useSelector((state) => 'GroupFeedMenu' in state.groups.queries ? state.groups.queries['GroupFeedMenu'].list : [])
    const currentUser = useSelector((state) => state.authentication.currentUser)

    useEffect(() => {
        if ( currentUser ) {
            makeRequest(getGroups('GroupFeedMenu', { userId: currentUser.id }))
        }

    }, [ currentUser ])

    const groupViews = []
    for(const groupId of groups) {
        const group = groupDictionary[groupId]

        groupViews.push(<li key={group.slug}>
            <a href={`/g/${group.slug}`}>{ group.title }</a>
        </li>)
    }
    groupViews.push(<li key={'view-more'}>
        <a href="/groups">View More</a>
    </li>)

    return (
        <div className="group-feed-menu">
            <a href=""><UserGroupIcon /> Groups</a>
            <menu className="group-feed-menu__groups">
                { groupViews }
            </menu>
        </div>
    )

}

export default GroupFeedMenu
