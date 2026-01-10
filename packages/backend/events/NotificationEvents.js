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

module.exports = class NotificationEvents {

    constructor(core) {
        this.core = core

        this.core.events.registerHandler('Notification', [ 'create' ], (event) => {
            return this.handle(event)
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
        } else if ( event.action === 'create' ) {
            this.create(event)
            return true
        }

        return false
    }

    unregisterConnection(userId, connectionId) {
        const subscriptions = this.core.events.getSubscriptions('Notification')

        for(const action  of Object.keys(subscriptions)) {
            if ( userId in subscriptions[action] ) {
                subscriptions[action][userId] = subscriptions[action][userId].filter((cid) => cid !== connectionId)
            }
        }
    }

    /**
     * Subscribe a user and connection to a Notification event.
     */
    subscribe(event) {
        const subscriptions = this.core.events.getSubscriptions('Notification')

        const action = event.context.action
        if ( ! (action in subscriptions ) ) {
            subscriptions[action] = {}
        }

        if ( ! (event.context.userId in subscriptions[action] ) ) {
            subscriptions[action][event.context.userId] = [] 
        }

        // Don't double subscribe a connection.
        if ( ! subscriptions[action][event.context.userId].includes(event.context.connectionId) ) {
            subscriptions[action][event.context.userId].push(event.context.connectionId) 
        }
    }

    unsubscribe(event) {
        const subscriptions = this.core.events.getSubscriptions('Notification')

        const action = event.context.action
        if ( action in subscriptions) {
            if ( event.context.userId in subscriptions[action] ) {
                subscriptions[action][event.context.userId] = subscriptions[action][event.context.userId].filter((cid) => cid !== event.context.connectionId)
            }
        }
    }

    create(event) {
        const createSubscriptions = this.core.events.getSubscriptions('Notification','create')

        if ( Array.isArray(event.audience) ) {
            for(const userId of event.audience ) {
                if ( userId in createSubscriptions ) {
                    for(const connectionId of createSubscriptions[userId]) {
                        this.core.events.sendEventToUserConnection(userId, connectionId, event)
                    }
                }
            }
        } else {
            const userId = event.audience
            if ( userId in createSubscriptions ) {
                for(const connectionId of createSubscriptions[userId]) {
                    this.core.events.sendEventToUserConnection(userId, connectionId, event)
                }
            }
        }
    }
}
