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

    log(level, message, object) {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        const logPrefix = this.getPrefix(level)

        if ( typeof message === 'object' ) {
            if ( level == Logger.levels.error) {
                console.error(logPrefix, message) 
            } else {
                console.log(logPrefix, message)
            }
        } else {
            if ( object !== undefined && object !== null ) {
                if ( level == Logger.levels.error) {
                    console.error(logPrefix + message, object)
                } else {
                    console.log(logPrefix + message, object)
                }

            } else {
                if ( level == Logger.levels.error) {
                    console.error(logPrefix + message)
                } else {
                    console.log(logPrefix + message)
                }
            }
        }
    }

    error(message, object) {
        if ( this.level < Logger.levels.error ) {
            return
        }

        this.log(Logger.levels.error, message, object)    
    }

    warn(message, object) {
        if ( this.level < Logger.levels.warn ) {
            return
        }

        if ( message instanceof Error ) {
            const content = `Warning: ${message.message}`
            this.log(Logger.levels.warn, content, object)
        } else {
            this.log(Logger.levels.warn, message, object)
        }
    }

    info(message, object) {
        if ( this.level < Logger.levels.info ) {
            return
        }

        this.log(Logger.levels.info, message, object)
    }

    debug(message, object) {
        if ( this.level < Logger.levels.debug) {
            return
        }

        this.log(Logger.levels.debug, message, object)
    }

    verbose(message, object) {
        if ( this.level < Logger.levels.verbose) {
            return
        }

        this.log(Logger.levels.verbose, message, object)
    }

    silly(message, object) {
        if ( this.level < Logger.levels.silly) {
            return
        }

        this.log(Logger.levels.silly, message, object)
    }

}
