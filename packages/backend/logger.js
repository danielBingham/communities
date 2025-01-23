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
        this.id = 'unknown' 
    }

    setId(id) {
        this.id = id
    }

    log(level, message) {
        // We don't need to log anything. 
        if ( level > this.level ) {
            return
        }

        const now = new Date()
        let logPrefix = `${now.toISOString()} ${this.id} ${Logger.levelDescriptions[level]} :: `
        if ( typeof message === 'object' ) {
            if ( level == Logger.levels.error) {
                console.log(logPrefix + 'Error encountered.') 
                console.error(message)
            } else {
                console.log(logPrefix + 'Logging object.')
                console.log(message)
            }
        } else {
            if ( level == Logger.levels.error) {
                console.error(logPrefix + message)
            } else {
                console.log(logPrefix + message)
            }
        }
    }

    error(message) {
        this.log(Logger.levels.error, message)    
    }

    warn(message) {
        if ( message instanceof Error ) {
            const content = `Warning: ${message.message}`
            this.log(Logger.levels.warn, content)
        } else {
            this.log(Logger.levels.warn, message)
        }
    }

    info(message) {
        this.log(Logger.levels.info, message)
    }

    http(message) {
        this.log(Logger.levels.http, message)
    }

    verbose(message) {
        this.log(Logger.levels.verbose, message)
    }

    debug(message) {
        this.log(Logger.levels.debug, message)
    }

    silly(message) {
        this.log(Logger.levels.silly, message)
    }

}
