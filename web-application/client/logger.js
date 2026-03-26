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

import { forwardLog } from '/state/system'

export class Logger  {
    /**
     * Use NPM's logging levels.
     */
    static levels = {
        critical: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        verbose: 5,
        silly: 6
    }

    static levelDescriptions = [
        'critical',
        'error',
        'warn',
        'info',
        'debug',
        'verbose',
        'silly'
    ]

    constructor(level) {
        this.store = null
        this.setLevel(level)
    }
    
    setStore(store) {
        this.store = store
    }

    setLevel(level) {
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

    }

    getPrefix(level) {
        const now = new Date()

        let first = `${now.toISOString()} ${Logger.levelDescriptions[level]} :: `
        
        return `${first}` 
    }

    forwardLog(level, message, ...args) {
        if ( this.store === null || this.store === undefined ) {
            return
        }

        let parsedMessage = message 
        if ( args !== undefined && args !== null && args.length > 0 ) {
            try { 
                for(const arg of args) {
                    if ( typeof arg === 'string' ) {
                        parsedMessage += arg
                    } else if ( typeof arg === 'number' ) {
                        parsedMessage += arg
                    } else {
                        parsedMessage += JSON.stringify(arg)
                    }
                }
            } catch (error) {
                console.error(`Failed to parse log args: `, error)
            }
        }

        const errors = []
        if ( args !== undefined && args !== null && args.length > 0) {
            for(const arg of args) {
                if ( arg instanceof Error) {
                    try {
                        const e = {
                            message: arg.message,
                            stack: '' 
                        }
                        if ( 'stack' in arg ) {
                            e.stack = arg.stack
                        }
                        errors.push(e)
                    } catch (error) {
                        console.error(`Failed to capture stack trace for error:`, error)
                    }
                }
            }
        }


        const now = new Date()
        const forwardedLog = {
            timestamp: now.toISOString(),
            level: level,
            message: parsedMessage,
            errors: errors 
        }

        this.store.dispatch(forwardLog(forwardedLog))
    }

    log(level, message, ...args) {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        this.forwardLog(level, message, ...args)

        let logPrefix = this.getPrefix(level) 
        if ( typeof message === 'string' ) {
            const prefixedMessage = logPrefix + message
            if ( level === Logger.levels.critical ) {
                console.error(prefixedMessage, ...args)
            } else if ( level === Logger.levels.error ) {
                console.error(prefixedMessage, ...args)
            } else if ( level === Logger.levels.warn ) {
                console.warn(prefixedMessage, ...args)
            } else {
                console.log(prefixedMessage, ...args)
            }
        } else {
            if ( level === Logger.levels.critical ) {
                console.error(logPrefix, message, ...args)
            } else if ( level === Logger.levels.error ) {
                console.error(logPrefix, message, ...args)
            } else if ( level === Logger.levels.warn ) {
                console.warn(logPrefix, message, ...args)
            } else {
                console.log(logPrefix, message, ...args)
            }
        }
    }

    critical(error) {
        if ( this.level < Logger.levels.critical) {
            return
        }

        this.log(Logger.levels.critical, "### Critical Error ###", error)
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

let environment = document.querySelector('meta[name="communities-environment"]').content
let initialLogLevel = 'info'
if ( environment === 'development' ) {
    initialLogLevel = 'debug'
} else if ( environment === 'staging' ) {
    initialLogLevel = 'verbose'
}

const logger = new Logger(initialLogLevel)
export default logger

