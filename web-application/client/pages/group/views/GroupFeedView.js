import { useSelector } from 'react-redux'

import can, { Actions, Entities} from '/lib/permission'

import { useGroupPermissionContext } from '/lib/hooks/Group'

import Feed from '/components/feeds/Feed'

import './GroupFeedView.css'

const GroupFeedView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    
    const [context, requests] = useGroupPermissionContext(currentUser, groupId)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)
    const canViewGroupPost = can(currentUser, Actions.view, Entities.GroupPost, context)

    if ( canViewGroup !== true || canViewGroupPost !== true ) {
        return (<div className="group-feed-view__private">The contents of this group are private.</div>)
    }

    return (
        <div>
            <Feed type="group" /> 
        </div>
    )
}

export default GroupFeedView
