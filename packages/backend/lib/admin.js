

const isModerator = function(user) {
    return user.siteRole === 'moderator' || user.siteRole === 'admin' || user.siteRole === 'superadmin'
}

module.exports = {
    isModerator: isModerator
}
