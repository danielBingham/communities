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

module.exports = class Events {

    constructor(redis, logger) {
        this.redis = redis
        this.subscriber = this.redis.duplicate()

        this.logger = logger

        /**
         * A dictionary of event subscriptions organized by Entity and action.  Each Entity
         * controls how it manages subscriptions, since a subscription may
         * depend on elements specific to that entity (such as its id).
         *
         * The top layer of the map is gauranteed to be Entity.  Below that you
         * will have to check each entity's Event handler to determine how that
         * entity organizes its subscriptions.
         */
        this.subscriptions = {}

        /**
         * A dictionary tracking users and their connections.
         *
         * Structure: 
         *
         * [userId]: {
         *   [connectionId]: connection(),
         *   [connectionId]: connection()
         * }
         */
        this.connections = {} 

        /**
         * A Dictionary of event handlers by Entity.  Handlers are registered by the Entity Controllers.
         *
         * Structure:
         *
         * [Entity]: handler()
         */
        this.handlers = {}
    }

    async initialize() {
        this.subscriber.on('error', (error) => {
            this.logger.error(error)
        })

        await this.subscriber.connect()

        await this.subscriber.subscribe('communities:events', (message, channel) =>  {
            const event = JSON.parse(message)
            this.handleEvent(event) 
        })
    }

    getSubscriptions(entity, action) {
        if ( ! (entity in this.subscriptions ) ) {
            throw new Error(`Missing subscriptions for '${entity}'.  Did you remember to register the handler?`)
        }

        if ( action === undefined || action === null ) {
            return this.subscriptions[entity]
        } 

        if ( ! (action in this.subscriptions[entity]) ) {
            throw new Error(`Missing subscriptions for '${action}'.  Did you remember to register that action?`)
        }

        return this.subscriptions[entity][action]
    }

    registerHandler(entity, actions, handler) {
        this.handlers[entity] = handler

        this.subscriptions[entity] = {}
        for(const action of actions) {
            this.subscriptions[entity][action] = {}
        }
    }

    sendEventToUserConnection(userId, connectionId, event) {
        if ( ! (userId in this.connections ) ) {
            this.logger.error(`Attempt to send an event to a user with no connections.`)
            return
        }

        if ( ! (connectionId in this.connections[userId] ) ) {
            this.logger.error(`Attempt to send an event to a non-existent connection.`)
            return
        }

        const connection = this.connections[userId][connectionId]
        // Don't send the audience.
        connection({ 
            entity: event.entity, 
            action: event.action,
            context: event.context,
            options: event.options
        })
    }
    
    handleEvent(event) {
        if ( event.entity in this.handlers ) {
            if ( event.entity in this.subscriptions ) {
                const handler = this.handlers[event.entity]
                const handled = handler(event)
                if ( ! handled ) {
                    this.logger.error(`Unhandled Event(${event.entity}:${event.action})`)
                    return
                }
            }
        }
    }

    subscribe(userId, connectionId, event) {
        if ( ! (userId in this.connections )) {
            this.logger.error(`Attempt to subscribe a user who isn't listening!`)
            return
        }

        if ( ! (connectionId in this.connections[userId])) {
            this.logger.error(`Attempt to subscribe a connection that isn't listening!`)
            return
        }

        if ( ! ('context' in event) ) {
            event.context = {}
        }

        event.context.userId = userId
        event.context.connectionId = connectionId

        if (event.entity in this.handlers ) {
            const handler = this.handlers[event.entity]
            const handled = handler(event)
            if ( ! handled ) {
                this.logger.error(`Unhandled Event(${event.entity}:${event.action})`)
                return
            }
        }

        const confirmEvent = { ...event }
        confirmEvent.action = 'confirmSubscription'
        this.sendEventToUserConnection(userId, connectionId, confirmEvent)
    }

    unsubscribe(userId, connectionId, event, options) {
        options = options || {}
        if ( ! (userId in this.connections )) {
            this.logger.error(`Attempt to unsubscribe a user who isn't listening!`)
            return
        }

        if ( ! (connectionId in this.connections[userId])) {
            this.logger.error(`Attempt to unsubscribe a connection that isn't listening!`)
            return
        }

        if ( ! ('context' in event) ) {
            event.context = {}
        }

        event.context.userId = userId
        event.context.connectionId = connectionId

        if (event.entity in this.handlers ) {
            const handler = this.handlers[event.entity]
            const handled = handler(event)
            if ( ! handled ) {
                this.logger.error(`Unhandled Event(${event.entity}:${event.action})`)
                return
            }
        }

        if ( options?.skipConfirmation !== true ) { 
            const confirmEvent = { ...event }
            confirmEvent.action = 'confirmUnsubscription'
            this.sendEventToUserConnection(userId, connectionId, confirmEvent)
        }
    }

    registerConnection(userId, connectionId, connection) {
        if ( ! (userId in this.connections) ) {
            this.connections[userId] = {} 
        }

        this.connections[userId][connectionId] = connection
    }
    
    unregisterConnection(userId, connectionId) {
        const event = {
            action: 'unregister',
            context: {
                userId: userId,
                connectionId: connectionId
            }
        }
        for (const [entity, handler] of Object.entries(this.handlers)) {
            handler(event)
        }

        if ( userId in this.connections) {
            delete this.connections[userId][connectionId]
        }
    }

    /**
     * @param {string|string[]} audience A userId or an array of userIds to whom this event should be delivered.
     * @param {string} entity   An entity name from the Entity:action system.  Eg. User, Post, PostComment, etc
     * @param {string} action   An action from the Entity:action system.  Eg. create, update, view, query, delete
     * @param {object} context  An object with context for this event.
     * @param {object} options  An object with options settings.
     *
     * `audience`, `context`, and `options` will be passed on to handlers.
     */
    async trigger(audience, entity, action, context, options) {
        const event = {
            audience: audience,
            entity: entity,
            action: action, 
            context: context,
            options: options
        }

        await this.redis.publish('communities:events', JSON.stringify(event))
    }
}
