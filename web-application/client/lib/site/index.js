export const canModerate = function(user) {
    return user.siteRole === 'moderator' || user.siteRole === 'admin' || user.siteRole === 'superadmin'
}

export const canAdmin = function(user) {
    return user.siteRole === 'admin' || user.siteRole === 'superadmin'
}

export const canSudo = function(user) {
    return user.siteRole === 'superadmin'
}
