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

module.exports = class BaseController {
    constructor(core) {
        this.core = core
    }

    sendUserErrors(response, status, errors) {
        if ( status < 400 || status > 499 ) {
            throw new Error(`'sendUserError' should only be used for user errors (400 - 499).`)
        }

        if ( Array.isArray(errors) ) {
            const returnedErrors = []
            for(const error of errors ) {
                this.core.logger.warn(error.log)
                returnedErrors.push({
                    type: error.type,
                    message: error.message
                })
            }

            let type = 'invalid'
            if ( status === 401 ) {
                type = 'not-authenticated'
            } else if ( status === 403 ) {
                type = 'not-authorized'
            } else if ( status === 409 ) {
                type = 'conflict'
            }

            response.status(status).json({
                error: {
                    type: type,
                    all: returnedErrors
                }
            })
        } else {
            this.core.logger.warn(errors.log)

            // The log message is not intended to be shown to the user, so
            // construct a new error to return without it.
            const returnedError = {
                type: errors.type,
                message: errors.message
            }
            response.status(status).json({
                error: returnedError
            })
        }
    }
}
