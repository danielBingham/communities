const canModerateSite = function(user) {
    return user.siteRole === 'moderator' || user.siteRole === 'admin' || user.siteRole === 'superadmin'
}

const canAdminSite = function(user) {
    return user.siteRole === 'admin' || user.siteRole === 'superadmin'
}

const canSudoSite = function(user) {
    return user.siteRole === 'superadmin'
}

export const SitePermissions = {
    MODERATE: 'moderate',
    ADMIN: 'admin',
    SUDO: 'sudo'
}

export const useSitePermission = function(user, action) {
    if ( action === SitePermissions.MODERATE && canModerateSite(user)) {
        return true
    } else if ( action === SitePermissions.ADMIN && canAdminSite(user)) {
        return true
    } else if ( action === SitePermissions.SUDO && canSudoSite(user)) {
        return true
    } else {
        return false
    }
}
