import React, { useState } from 'react'

import { UsersIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { useGroup } from '/lib/hooks/group'
import { usePost } from '/lib/hooks/post'

import { DropdownMenu, DropdownMenuBody, DropdownMenuTrigger, DropdownMenuItem } from '/components/ui/DropdownMenu'


import './PostVisibilityControl.css'

const PostVisibilityControl = function({ visibility, setVisibility, postId, groupId }) {

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)

    if ( group !== null ) {
        if ( visibility === 'private' ) {
            return (
                <div className="post-visibility-control">
                    <span className="post-visibility-control__current"> <UserGroupIcon /> <span className="text">Group</span></span>
                </div>
            )
        } else if ( visibility === 'public' ) {
            return (
                <div className="post-visibility-control">
                    <span className="post-visibility-control__current"> <GlobeAltIcon /> <span className="text">Public</span></span>
                </div>
            )
        }
    }

    let current = (<span className="post-visibility-control__current"><UsersIcon /> <span className="text">Friends</span></span>)
    if (visibility == 'public' ) {
        current = (<span className="post-visibility-control__current"> <GlobeAltIcon /> <span className="text">Public</span></span>)
    }

    return (
        <div className="post-visibility-control">
            <DropdownMenu closeOnClick={true}>
                <DropdownMenuTrigger showArrow={false}>{ current }</DropdownMenuTrigger>
                <DropdownMenuBody>
                    <DropdownMenuItem onClick={() => setVisibility('private')}>
                        { group !== null && <span> <UserGroupIcon /> <span>Group</span></span> }
                        { group === null && <span> <UsersIcon /> <span>Friends</span></span> }
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibility('public')}>
                        <span><GlobeAltIcon /><span>Public</span></span>
                    </DropdownMenuItem>
                </DropdownMenuBody>
            </DropdownMenu>
        </div>
    )

}

export default PostVisibilityControl
