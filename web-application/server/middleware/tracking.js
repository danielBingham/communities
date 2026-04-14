
const createUserTrackingMiddleware = function(core) {
    return async function(request, response, next) {
        try { 
            if ( ! core.features.has('feat-292-track-user-activity') ) {
                next()
                return
            }

            const currentUser = request.session.user
            if ( ! currentUser ) {
                next()
                return
            }

            const date = new Date(currentUser.activityDate)
            const now = new Date()

            const diffSeconds = Math.floor((now.getTime() - date.getTime())/1000)

            // If more than a day has passed since their last sighting, update
            // the last activity.
            if ( diffSeconds > 24 * 60 * 60 ) {
                const results = await core.database.query(`UPDATE users SET activity_date = now() WHERE id = $1 returning activity_date`, [ currentUser.id ])
                request.session.user.activityDate = results.rows[0].activity_date
            }

            next()
        } catch (error) {
            core.logger.error(error)
            next()
        }

    }
}

module.exports = {
    createUserTrackingMiddleware: createUserTrackingMiddleware
}
