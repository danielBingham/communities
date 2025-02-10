import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { UsersIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { getGroup } from '/state/groups'

import './PostVisibility.css'

const PostVisibility = function({ groupId }) {

    const [request, makeRequest] = useRequest()

    const group = useSelector((state) => groupId && groupId in state.groups.dictionary ? state.groups.dictionary[groupId] : null)

    useEffect(() => {
        if ( groupId && ! group ) {
            makeRequest(getGroup(groupId))
        }
    }, [ groupId, group ])

    return (
        <div className="post-visibility">
            { groupId && <span><UserGroupIcon /> <span className="text">Group</span></span> }
            { group && group.type == 'open' && <span>, <GlobeAltIcon /> <span className="text">Public</span></span> }
            { ! groupId && <span> <UsersIcon /> <span className="text">Friends</span></span> }
        </div>
    )

}

export default PostVisibility
