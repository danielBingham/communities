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

        this.listeners = {} 
    }

    async initialize() {
        this.subscriber.on('error', (error) => {
            this.logger.error(error)
        })

        await this.subscriber.connect()

        await this.subscriber.subscribe('communities:events', (message, channel) =>  {
            const event = JSON.parse(message)
            console.log(`Events: Got an event: `)
            console.log(event)
            this.handleEvent(event) 
        })
    }
    
    handleEvent(event) {
        console.log(`Handling event: `)
        console.log(event)

        console.log(`With listeners: `)
        console.log(this.listeners)
        if ( Array.isArray(event.audience) ) {
            for(const userId of event.audience ) {
                if ( userId in this.listeners ) {
                    for(const listener of this.listeners[userId]) {
                        console.log(`Triggering a listener for ${userId}.`)
                        // Don't send the audience.
                        listener({ 
                            entity: event.entity, 
                            action: event.action,
                            context: event.context,
                            options: event.options
                        })
                    }
                }
            }
        } else {
            const userId = event.audience
            if ( userId in this.listeners ) {
                for(const listener of this.listeners[userId]) {
                    // Don't send the audience.
                    console.log(`Triggering a listener for ${userId}.`)
                    listener({ 
                        entity: event.entity, 
                        action: event.action,
                        context: event.context,
                        options: event.options
                    })
                }
            }
        }
    }

    listen(userId, listener) {
        if ( ! (userId in this.listeners) ) {
            this.listeners[userId] = []
        }
        this.listeners[userId].push(listener) 
    }
    
    stopListening(userId, listener) {
        if ( userId in this.listeners) {
            this.listeners[userId] = this.listeners[userId].filter((l) => l !== listener)
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

        console.log(`Triggering event: `)
        console.log(event)
        await this.redis.publish('communities:events', JSON.stringify(event))
    }
}
