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

module.exports = class JobEvents {

    constructor(core) {
        this.core = core

        this.core.events.registerHandler('Job', [ 'update' ], (event) => {
            return this.handle(event)
        })

        this.listen('process-video')
        this.listen('resize-image')
        this.listen('send-notifications')
    }

    listen(name) {
        if ( ! ( name in this.core.queues) ) {
            throw new Error(`Invalid queue named '${name}'.`)
        }

        const queue = this.core.queues[name]

        queue.on('error', (error) => {
            this.core.logger.error(error)
        })

        queue.on('global:active', async (jobId, jobPromise) => {
            const job = await queue.getJob(jobId)
            const audience = job.data?.session?.user?.id || 'all'
            this.core.events.trigger(audience, 'Job', 'update', { 
                type: 'active',
                queue: name,
                jobId: jobId,
                entity: job 
            })
        })

        queue.on('global:progress', async (jobId, progress) => {
            const job = await queue.getJob(jobId)
            const audience = job.data?.session?.user?.id || 'all'
            this.core.events.trigger(audience, 'Job', 'update', { 
                type: 'progress',
                queue: name,
                jobId: jobId,
                entity: job 
            })
        })

        queue.on('global:completed', async (jobId, result) => {
            const job = await queue.getJob(jobId)
            const audience = job.data?.session?.user?.id || 'all'
            this.core.events.trigger(audience, 'Job', 'update', { 
                type: 'completed',
                queue: name,
                jobId: jobId,
                entity: job 
            })
        })

        queue.on('global:failed', async (jobId, err) => {
            const job = await queue.getJob(jobId)
            const audience = job.data?.session?.user?.id || 'all'
            this.core.events.trigger(audience, 'Job', 'update', { 
                type: 'failed',
                queue: name,
                jobId: jobId,
                entity: job 
            })
        })

    }

    handle(event) {
        if ( event.action === 'unregister' ) {
            this.unregisterConnection(event.context.userId, event.context.connectionId)
            return true
        } else if ( event.action === 'subscribe' ) {
            this.subscribe(event)
            return true
        } else if ( event.action === 'unsubscribe' ) {
            this.unsubscribe(event)
            return true
        } else if ( event.action === 'update' ) {
            this.update(event)
            return true
        }

        return false
    }

    unregisterConnection(userId, connectionId) {
        const subscriptions = this.core.events.getSubscriptions('Job')

        for(const action of Object.keys(subscriptions)) {
            for(const jobId of Object.keys(subscriptions[action])) {
                if ( userId in subscriptions[action][jobId] ) {
                    if ( connectionId in subscriptions[action][jobId][userId] ) {
                        delete subscriptions[action][jobId][userId][connectionId]
                    }
                }
            }
        }
    }

    /**
     * Subscribe a user and connection to a Notification event.
     */
    subscribe(event) {
        const subscriptions = this.core.events.getSubscriptions('Job')

        const action = event.context.action
        const queue = event.context.queue
        const jobId = event.context.jobId
        const userId = event.context.userId
        const connectionId = event.context.connectionId


        if ( ! (action in subscriptions ) ) {
            subscriptions[action] = {}
        }
        
        if ( ! ( queue in subscriptions[action] ) ) {
            subscriptions[action][queue] = {}
        }

        if ( ! ( jobId in subscriptions[action][queue] ) ) {
            subscriptions[action][queue][jobId] = {} 
        }

        if ( ! (userId in subscriptions[action][queue][jobId] ) ) {
            subscriptions[action][queue][jobId][userId] = {} 
        }

        if ( ! ( connectionId in subscriptions[action][queue][jobId][userId] ) ) {
            subscriptions[action][queue][jobId][userId][connectionId] = true
        }
    }

    unsubscribe(event) {
        const subscriptions = this.core.events.getSubscriptions('Job')

        const action = event.context.action
        const queue = event.context.queue
        const jobId = event.context.jobId
        const userId = event.context.userId
        const connectionId = event.context.connectionId

        if ( action in subscriptions) {
            if ( queue in subscriptions[action] ) {
                if ( jobId in subscriptions[action][queue]) {
                    if ( userId in subscriptions[action][queue][jobId] ) {
                        if ( connectionId in subscriptions[action][queue][jobId][userId] ) {
                            delete subscriptions[action][queue][jobId][userId][connectionId]
                        }
                    }
                }
            }
        }
    }

    /**
     * Job Context:
     *
     * {
     *  jobId,
     *  entity 
     *  }
     */
    update(event) {
        const subscriptions = this.core.events.getSubscriptions('Job','update')
        const jobId = event.context.jobId
        const audience = event.audience
        
        if ( jobId in subscriptions ) {
            for(const userId of Object.keys(subscriptions[jobId]) ) {
                if ( audience === userId || audience === 'all') {
                    for(const connectionId of Object.keys(subscriptions[jobId][userId]) ) {
                        this.core.events.sendEventToUserConnection(userId, connectionId, event)
                    }
                }
            }
        }
    }
}
