
const canAdminGroup = function(user, context) {
    if ( context.group === undefined || context.group === null ) {
        return false
    }

    if ( context.userMember !== undefined && context.userMember !== null 
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'member' 
        && context.userMember.role === 'admin') 
    {
        return true 
    }
    return false 
}

const canModerateGroup = function(user, context) {
    if ( context.group === undefined || context.group === null ) {
        return false
    }

    if ( context.userMember !== undefined && context.userMember !== null 
        && context.userMember.groupId === context.group.id
        && context.userMember.status === 'member' 
        && (context.userMember.role === 'moderator' || context.userMember.role === 'admin')) 
    {
        return true 
    }

    return false 
}

const canCreateGroup = function(user, context) {
    return true
}

const canViewGroup = function(user, context) {
    if ( context.canModerateSite === true ) {
        return true
    }

    if ( context.group === undefined || context.group === null ) {
        return false
    }

    if ( context.group.type === 'open' || context.group.type == 'private') {
        return true
    }

    if ( context.userMember !== undefined && context.userMember !== null 
        && context.userMember.groupId === context.group.id
        && context.userMember.status !== 'banned' ) 
    {
        return true 
    }

    return false 
}

const canUpdateGroup = function(user, context) {
    return canAdminGroup(user, context)
}

const canDeleteGroup = function(user, context) {
    return canAdminGroup(user, context)
}

module.exports = {
    canAdminGroup: canAdminGroup,
    canModerateGroup: canModerateGroup,
    canCreateGroup: canCreateGroup,
    canViewGroup: canViewGroup,
    canUpdateGroup: canUpdateGroup,
    canDeleteGroup: canDeleteGroup,
}
