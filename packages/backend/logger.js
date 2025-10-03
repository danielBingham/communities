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
const Uuid = require('uuid')

module.exports = class Logger  {
    /**
     * Use NPM's logging levels.
     */
    static levels = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        verbose: 4,
        silly: 5
    }

    static levelDescriptions = [
        'error',
        'warn',
        'info',
        'debug',
        'verbose',
        'silly'
    ]

    constructor(level) {
        this.database = null

        this.level = Logger.levels.info
        if (Number.isInteger(level)) {
            this.level = level
        } else {
            for(let l = 0; l <= Logger.levels.silly; l++) {
                if ( level === Logger.levelDescriptions[l] ) {
                    this.level = l
                    break
                }
            }
        }
        this.platform = 'server'
       
        this.traceId = Uuid.v4()
        this.userId = null
        this.username = null

        // This should be a UUID generated and attached to the session
        // specifically to serve as a session trace for logging.
        //
        // IT MUST NOT be the actual session id.
        this.sessionId = null

        this.method = null
        this.endpoint = null
    }

    getPrefix(level) {
        const now = new Date()

        let first = `${now.toISOString()} ${Logger.levelDescriptions[level]} :: `

        let second = ''
        if ( this.sessionId !== null ) {
            second += this.sessionId + ' ' 
        }

        if ( this.username !== null ) {
            second += this.username + ' '
        } else if ( this.userId !== null ) {
            second += this.userId + ' '
        } else if ( this.traceId !== null ) {
            second += this.traceId + ' '
        }

        if ( this.method !== null ) {
            second += this.method + ' '
        }

        if ( this.endpoint !== null ) {
            second += this.url + ' '
        }

        if ( second !== '' ) {
            second += ':: '
        }
        
        return `${first}${second}` 
    }

    log(level, message, ...args) {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        const logPrefix = this.getPrefix(level)

        if ( typeof message === 'string' ) {
            const prefixedMessage = logPrefix + message
            if ( level === Logger.levels.error ) {
                console.error(prefixedMessage, ...args)
            } else if ( level === Logger.levels.warn ) {
                console.warn(prefixedMessage, ...args)
            } else {
                console.log(prefixedMessage, ...args)
            }
        } else {
            if ( level === Logger.levels.error ) {
                console.error(logPrefix, message, ...args)
            } else if ( level === Logger.levels.warn ) {
                console.warn(logPrefix, message, ...args)
            } else {
                console.log(logPrefix, message, ...args)
            }
        }

        if ( this.database !== null ) {
            const databaseMessage = util.format(message, ...args)

            try {
                this.database.query(`INSERT INTO logs (level, platform, trace_id, user_id, session_id, method, endpoint, message)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [ Logger.levelDescriptions[level], this.platform, this.traceId, this.userId, this.sessionId, this.method, this.endpoint, databaseMessage]).catch((error) => {
                    console.warn(`Failed to write log to database.`)
                    console.error(error)
                })
            } catch (error) {
                console.warn(`Failed to write log to database.`)
                console.error(error)
            }
        }
    }

    error(message, ...args) {
        if ( this.level < Logger.levels.error ) {
            return
        }

        this.log(Logger.levels.error, message, ...args)    
    }

    warn(message, ...args) {
        if ( this.level < Logger.levels.warn ) {
            return
        }

        this.log(Logger.levels.warn, message, ...args)
    }

    info(message, ...args) {
        if ( this.level < Logger.levels.info ) {
            return
        }

        this.log(Logger.levels.info, message, ...args)
    }

    debug(message, ...args) {
        if ( this.level < Logger.levels.debug) {
            return
        }

        this.log(Logger.levels.debug, message, ...args)
    }

    verbose(message, ...args) {
        if ( this.level < Logger.levels.verbose) {
            return
        }

        this.log(Logger.levels.verbose, message, ...args)
    }

    silly(message, ...args) {
        if ( this.level < Logger.levels.silly) {
            return
        }

        this.log(Logger.levels.silly, message, ...args)
    }

}
