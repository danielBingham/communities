import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { SitePermissions, useSitePermission } from './useSitePermission'

/**
 * Are the contents of this group hidden for the current member?
 */
const canViewGroup = function(group, currentMember) {
    return group?.type === 'open' || ( currentMember?.status == 'member')
}

const canModerateGroup = function(group, currentMember) {
    return currentMember?.role == 'moderator' || currentMember?.role == 'admin'
}

const canAdminGroup = function(group, currentMember) {
    return currentMember?.role == 'admin'
}

export const GroupPermissions = {
    VIEW: 'view',
    MODERATE: 'moderate',
    ADMIN: 'admin'
}

export const useGroupPermission = function(currentUser, action, groupId) {
    const [group] = useGroup(groupId)
    const [currentMember] = useGroupMember(groupId, currentUser.id)
    const canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    if ( action === GroupPermissions.VIEW && (canModerateSite || canViewGroup(group, currentMember)) ) {
        return true 
    } else if ( action === GroupPermissions.MODERATE && canModerateGroup(group, currentMember) ) {
        return true 
    } else if ( action === GroupPermissions.ADMIN && canAdminGroup(group, currentMember) ) {
        return true 
    } else {
        return false
    }
}
