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

module.exports = class UserErrors {
    constructor(core, logger) {
        this.core = core
        this.logger = logger ? logger : this.core.logger

        this.errors = []
        this.status = 499 
    }

    hasErrors() {
        return this.errors.length > 0
    }

    addErrors(status, errors) {
        if ( status < this.status ) {
            this.status = status
        }

        if ( Array.isArray(errors) ) {
            for(const error of errors ) {
                this.logger.warn(error.log)
                this.errors.push({
                    type: error.type,
                    message: error.message,
                    context: error.context
                })
            }
        } else {
            this.logger.warn(errors.log)
            this.errors.push({
                type: errors.type,
                message: errors.message,
                context: errors.context
            })
        }
        console.log(`Post add: `, this.errors)
    }

    getErrors() {
        let type = 'invalid'
        if ( this.status === 401 ) {
            type = 'not-authenticated'
        } else if ( this.status === 403 ) {
            type = 'not-authorized'
        } else if ( this.status === 409 ) {
            type = 'conflict'
        }

        return {
            error: {
                type: type,
                all: this.errors 
            }
        }
    }
}
