import { UsersIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { useGroup } from '/lib/hooks/Group'
import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import { DropdownMenu, DropdownMenuBody, DropdownMenuTrigger, DropdownMenuItem } from '/components/ui/DropdownMenu'


import './PostVisibilityControl.css'

const PostVisibilityControl = function({ postId, groupId, sharedPostId }) {

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const setVisibility = function(visibility) {
        const newDraft = { ...draft }
        draft.visibility = visibility
        setDraft(newDraft)
    }

    if ( group !== undefined && group !== null ) {
        if ( draft.visibility === 'private' ) {
            return (
                <div className="post-visibility-control">
                    <span className="post-visibility-control__current"> <UserGroupIcon /> <span className="text">Group</span></span>
                </div>
            )
        } else if ( draft.visibility === 'public' ) {
            return (
                <div className="post-visibility-control">
                    <span className="post-visibility-control__current"> <GlobeAltIcon /> <span className="text">Public</span></span>
                </div>
            )
        }
    }

    if ( draft.type === 'announcement' || draft.type === 'info' ) {
        return (
            <div className="post-visibility-control">
                <span className="post-visibility-control__current"> <GlobeAltIcon /> <span className="text">Public</span></span>
            </div>
        )
    }

    let current = (<span className="post-visibility-control__current"><UsersIcon /> <span className="text">Friends</span></span>)
    if (draft.visibility == 'public' ) {
        current = (<span className="post-visibility-control__current"> <GlobeAltIcon /> <span className="text">Public</span></span>)
    }

    return (
        <div className="post-visibility-control">
            <DropdownMenu autoClose={true}>
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
