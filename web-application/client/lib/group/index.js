
/**
 * Are the contents of this group hidden for the current member?
 */
export const canView = function(group, currentMember) {
    return group.type === 'open' || ( currentMember && currentMember.status == 'member')
}

export const canAdmin = function(currentMember) {
    return currentMember && currentMember.role == 'admin'
}

export const canModerate = function(currentMember) {
    return currentMember && (currentMember.role == 'moderator' || currentMember.role == 'admin')
}
