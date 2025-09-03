import { useState } from 'react'
import { useSelector } from 'react-redux'

import { QueueListIcon, InformationCircleIcon, MegaphoneIcon } from '@heroicons/react/24/solid'

import { usePostDraft } from '/lib/hooks/usePostDraft'
import { useSitePermission, SitePermissions } from '/lib/hooks/permission'

import { DropdownMenu, DropdownMenuBody, DropdownMenuTrigger, DropdownMenuItem } from '/components/ui/DropdownMenu'

import './PostTypeControl.css'

const PostTypeControl = function({ type, setType, postId, groupId, sharedPostId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [draft, setDraft ] = usePostDraft(postId, groupId, sharedPostId)
    const canAdminSite = useSitePermission(currentUser, SitePermissions.ADMIN)

    if ( groupId ) {
        return null
    }

    if ( ! canAdminSite ) {
        return null
    }


    let current = (<span className="post__type-control__current"><QueueListIcon /> <span className="nav-text">Feed</span></span>)
    if ( draft && draft.type === 'info' ) {
        current = (<span className="post__type-control__current"><InformationCircleIcon /> <span className="nav-text">Info</span></span>)
    } else if ( draft && draft.type === 'announcement' ) {
        current = (<span className="post__type-control__current"><MegaphoneIcon /> <span className="nav-text">Announcement</span></span>)
    }

    return (
        <div className="post__type-control">
            <DropdownMenu autoClose={true}>
                <DropdownMenuTrigger showArrow={false}>{ current }</DropdownMenuTrigger>
                <DropdownMenuBody>
                    <DropdownMenuItem onClick={() => setType('feed')}>
                        <span><QueueListIcon /> Feed</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setType('info')}>
                        <span><InformationCircleIcon /> Info</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setType('announcement')}>
                        <span><MegaphoneIcon /> Announcement</span>
                    </DropdownMenuItem>
                </DropdownMenuBody>
            </DropdownMenu>

        </div>
    )

}

export default PostTypeControl
