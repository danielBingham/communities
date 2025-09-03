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

export class Logger  {
    /**
     * Use NPM's logging levels.
     */
    static levels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6
    }

    static levelDescriptions = [
        'error',
        'warn',
        'info',
        'http',
        'verbose',
        'debug',
        'silly'
    ]

    constructor(level) {
        this.setLevel(level)
    }

    setLevel(level) {
        if (Number.isInteger(level)) {
            this.level = level
        } else {
            if (level == 'error') {
                this.level = Logger.levels.error
            } else if (level == 'warn') {
                this.level = Logger.levels.warn
            } else if (level == 'info') {
                this.level = Logger.levels.info
            } else if (level == 'http') {
                this.level = Logger.levels.http
            } else if (level == 'verbose') {
                this.level = Logger.levels.verbose
            } else if (level == 'debug') {
                this.level = Logger.levels.debug
            } else if (level == 'silly') {
                this.level = Logger.levels.silly
            }
        }

    }

    log(level, message, object) {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        const now = new Date()
        let logPrefix = `${now.toISOString()} ${Logger.levelDescriptions[level]} :: `

        if ( typeof message === 'object' ) {
            if ( level == Logger.levels.error) {
                console.log(logPrefix + 'Error encountered.') 
                console.error(message)
                Sentry.captureException(message)
            } else {
                console.log(logPrefix + 'Logging object.')
                console.log(message)
                Sentry.captureMessage(message)
            }
        } else {
            if ( object !== undefined && object !== null ) {
                if ( level == Logger.levels.error) {
                    console.error(logPrefix + message, object)
                    Sentry.captureException(`${logPrefix + message}: ${JSON.stringify(object)}`)
                } else {
                    console.log(logPrefix + message, object)
                    Sentry.captureMessage(`${logPrefix + message}: ${JSON.stringify(object)}`)
                }

            } else {
                if ( level == Logger.levels.error) {
                    console.error(logPrefix + message)
                    Sentry.captureException(message)
                } else {
                    console.log(logPrefix + message)
                    Sentry.captureMessage(message)
                }
            }
        }
    }

    error(message, object) {
        this.log(Logger.levels.error, message, object)    
    }

    warn(message, object) {
        if ( message instanceof Error ) {
            const content = `Warning: ${message.message}`
            this.log(Logger.levels.warn, content, object)
        } else {
            this.log(Logger.levels.warn, message, object)
        }
    }

    info(message, object) {
        this.log(Logger.levels.info, message, object)
    }

    http(message, object) {
        this.log(Logger.levels.http, message, object)
    }

    verbose(message, object) {
        this.log(Logger.levels.verbose, message, object)
    }

    debug(message, object) {
        this.log(Logger.levels.debug, message, object)
    }

    silly(message, object) {
        this.log(Logger.levels.silly, message, object)
    }
}

const logger = new Logger('info')
export default logger

