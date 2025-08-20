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
    }

    handle(event) {
        if ( event.action === 'subscribe' ) {
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

    subscribe(event) {
        const subscriptions = this.core.events.getSubscriptions('Notification')

        const action = event.context.action
        if ( ! (action in subscriptions ) ) {
            subscriptions[action] = {}
        }

        if ( ! (event.context.userId in subscriptions[action] ) ) {
            subscriptions[action][event.context.userId] = [] 
        }

        subscriptions[action][event.context.userId].push(event.context.connectionId) 
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
