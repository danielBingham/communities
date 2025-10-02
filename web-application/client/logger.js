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

    log(level, message, object) {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        let logPrefix = this.getPrefix(level) 

        if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
            if ( typeof message === 'object' ) {
                message = JSON.stringify(message)
            }

            if ( object ) {
                object = JSON.stringify(object)
            }
        }

        if ( typeof message === 'object' ) {
            if ( level == Logger.levels.error) {
                console.error(logPrefix, message) 
                Sentry.captureException(message)
            } else {
                console.log(logPrefix, message)
            }
        } else {
            if ( object !== undefined && object !== null ) {
                if ( level == Logger.levels.error) {
                    console.error(logPrefix + message, object)
                    Sentry.captureException(`${logPrefix + message}: ${JSON.stringify(object)}`)
                } else {
                    console.log(logPrefix + message, object)
                }

            } else {
                if ( level == Logger.levels.error) {
                    console.error(logPrefix + message)
                    Sentry.captureException(message)
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

let environment = document.querySelector('meta[name="communities-environment"]').content
let initialLogLevel = 'info'
if ( environment === 'development' ) {
    initialLogLevel = 'debug'
}

const logger = new Logger(initialLogLevel)
export default logger

