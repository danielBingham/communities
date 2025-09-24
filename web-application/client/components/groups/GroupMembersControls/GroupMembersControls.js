import { useSelector } from 'react-redux'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import Button from '/components/ui/Button'

import { 
    GroupPermissions, useGroupPermission,
} from '/lib/hooks/permission'

import './GroupMembersControls.css'

const GroupMembersControls = function({ groupId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupRequest] = useGroup(groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const context = {
        group: group,
        userMember: currentMember
    }

    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, context)
    if ( ! canModerateGroup ) {
        return null
    }

     return (
         <div className="group-members-controls">
             <Button href={`/group/${group.slug}/invite`} type="primary">Invite Friends</Button>
             <Button href={`/group/${group.slug}/email-invite`} type="primary">Invite by Email</Button>
         </div> 
    )
}

export default GroupMembersControls
