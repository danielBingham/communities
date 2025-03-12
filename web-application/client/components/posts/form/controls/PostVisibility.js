import React from 'react'

import { UsersIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { useGroup } from '/lib/hooks/group/useGroup'

import './PostVisibility.css'

const PostVisibility = function({ groupId }) {

    const group = useGroup(groupId) 

    return (
        <div className="post-visibility">
            { groupId && <span><UserGroupIcon /> <span className="text">Group</span></span> }
            { group && group.type == 'open' && <span>, <GlobeAltIcon /> <span className="text">Public</span></span> }
            { ! groupId && <span> <UsersIcon /> <span className="text">Friends</span></span> }
        </div>
    )

}

export default PostVisibility
