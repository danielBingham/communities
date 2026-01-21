/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
const { JobEvents } = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class JobController {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger
        this.config = core.config
    }

    async getJobs(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User may only get their own jobs (or must be admin).
         * 
         * ********************************************************************/
        
        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted retrieve jobs.`)
        }

        const name = request.params.queue

        const jobs = {
            waiting: [],
            active: [],
            completed: []
        }
        
        jobs.waiting = await this.core.queues[name].getJobs(['waiting'])
        jobs.active = await this.core.queues[name].getJobs(['active'])
        jobs.completed = await this.core.queues[name].getJobs(['completed'])

        if ( request.session.user.siteRole == 'admin' || request.session.user.siteRole == 'superadmin') {
            return response.status(200).json(jobs)
        }

        let returnJobs = {
            waiting: [],
            active: [],
            completed: []
        }

        for ( const job of jobs.waiting ) {
            if ( job.data.session.user.id == request.session.user.id ) {
                returnJobs.waiting.push(job)
            }
        }

        for ( const job of jobs.active) {
            if ( job.data.session.user.id == request.session.user.id ) {
                returnJobs.active.push(job)
            }
        }

        for ( const job of jobs.completed) {
            if ( job.data.session.user.id == request.session.user.id ) {
                returnJobs.completed.push(job)
            }
        }

        return response.status(200).json(returnJobs)
    }

    async getJob(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User may only get their own job (or must be admin).
         *
         * Validation:
         *
         * 1. :id must be set.
         * 
         * ********************************************************************/

        const name = request.params.queue
        const jobId = request.params.id

        // Validation: 1. :id must be set
        if ( ! jobId ) {
            throw new ControllerError(400, 'id-missing',
                `Attempt to get job, but missing jobId.`)
        }

        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to get Job(${jobId}).`)
        }
        
        const job = await this.core.queues[name].getJob(jobId)

        // 2. User may only get their own job (or must be admin).
        if ( job.data.session.user.id !== request.session.user.id && request.session.user.siteRole != 'admin' && request.session.user.siteRole != 'superadmin' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${request.session.user.id}) attempted to access Job(${jobId}) which they did not trigger.`)
        }


        return response.status(200).json(job.toJSON())
    }

    async postJob(request, response) {
        throw new ControllerError(503, 'not-implemented', '')
    }

    async patchJob(request, response) {
        throw new ControllerError(503, 'not-implemented', '')

        // TODO Implement me to allow for pausing and resuming of jobs.
    }

    async deleteJob(request, response) {
        throw new ControllerError(503, 'not-implemented', '')

        // TODO Implement me to allow for canceling of jobs.

    }

    // ================  JOBS ==========================

}
