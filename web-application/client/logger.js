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

import * as Sentry from "@sentry/react";
import { Capacitor } from '@capacitor/core'

export class Logger  {
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
        this.setLevel(level)
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

    log(level, message, ...args) {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        let logPrefix = this.getPrefix(level) 
        if ( typeof message === 'string' ) {
            const prefixedMessage = logPrefix + message
            if ( level === Logger.levels.error ) {
                console.error(prefixedMessage, ...args)
                Sentry.captureException(new Error(message))
            } else if ( level === Logger.levels.warn ) {
                console.warn(prefixedMessage, ...args)
                Sentry.captureException(new Error(message))
            } else {
                console.log(prefixedMessage, ...args)
            }
        } else {
            if ( level === Logger.levels.error ) {
                console.error(logPrefix, message, ...args)
                Sentry.captureException(message)
            } else if ( level === Logger.levels.warn ) {
                console.warn(logPrefix, message, ...args)
                Sentry.captureException(message)
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

let environment = document.querySelector('meta[name="communities-environment"]').content
let initialLogLevel = 'info'
if ( environment === 'development' ) {
    initialLogLevel = 'debug'
} else if ( environment === 'staging' ) {
    initialLogLevel = 'verbose'
}

const logger = new Logger(initialLogLevel)
export default logger

