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

    constructor(level, id, method, url) {
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

        // For the core logger, we don't know what request this is.
        this.id = '' 
        if ( id ) {
            this.id = id
        }

        this.method = ''
        if ( method ) {
            this.method = method
        }

        this.url = ''
        if ( url ) {
            this.url = url
        }
    }

    setId(id) {
        this.id = id
    }

    getPrefix(level) {
        const now = new Date()

        let first = `${now.toISOString()} ${Logger.levelDescriptions[level]} :: `

        let second = ''
        if ( this.id !== '' ) {
            second += this.id + ' '
        }

        if ( this.method !== '' ) {
            second += this.method + ' '
        }

        if ( this.url !== '' ) {
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
