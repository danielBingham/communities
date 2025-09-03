import { useState } from 'react'
import { useSelector } from 'react-redux'

import { usePostDraft } from '/lib/hooks/usePostDraft'
import { useSitePermission, SitePermissions } from '/lib/hooks/permission'

import { DropdownMenu, DropdownMenuBody, DropdownMenuTrigger, DropdownMenuItem } from '/components/ui/DropdownMenu'

import './PostTypeControl.css'

const PostTypeControl = function({ postId, groupId, sharedPostId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [draft, setDraft ] = usePostDraft(postId, groupId, sharedPostId)
    const canAdminSite = useSitePermission(currentUser, SitePermissions.ADMIN)

    const setType = function(type) {
        const newDraft = { ...draft }
        newDraft.type = type
        setDraft(newDraft)
    }

    if ( groupId ) {
        return null
    }

    if ( ! canAdminSite ) {
        return null
    }

    let current = (<span className="post__type-control__current">{ draft ? draft.type : 'Feed' }</span>)

    return (
        <div className="post__type-control">
            <DropdownMenu autoClose={true}>
                <DropdownMenuTrigger showArrow={false}>{ current }</DropdownMenuTrigger>
                <DropdownMenuBody>
                    <DropdownMenuItem onClick={() => setType('feed')}>
                        <span>Feed</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setType('info')}>
                        <span>Info</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setType('announcement')}>
                        <span>Announcement</span>
                    </DropdownMenuItem>
                </DropdownMenuBody>
            </DropdownMenu>

        </div>
    )

}

export default PostTypeControl
