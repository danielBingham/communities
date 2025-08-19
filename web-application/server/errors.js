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

const ControllerError = require('./errors/ControllerError')

const createErrorsMiddleware = function(core) {
    return function(error, request, response, next) {
        console.error(error)
        try {
            // Log the error.
            if ( error instanceof ControllerError ) {
                if ( error.status < 500 ) {
                    core.logger.warn(error)
                } else {
                    core.logger.error(error)
                }
            } else {
                core.logger.error(error)
            }

            if ( error instanceof ControllerError) {
                response.status(error.status).json({
                    error: {
                        type: error.type, 
                        message: error.publicMessage
                    }
                })
                return 
            } else { 
                response.status(500).json({ 
                    error: {
                        type: 'server-error',
                        message: `Something went wrong on the backend in a way we couldn't handle.  Please report this as a bug!`
                    }
                })
                return
            }
        } catch (secondError) {
            // If we fucked up something in our error handling.
            core.logger.error(secondError)
            response.status(500).json({ 
                error: {
                    type: 'server-error',
                    message: `Something went wrong on the backend in a way we couldn't handle.  Please report this as a bug!`
                }
            })
        }
    }
}

module.exports = {
    createErrorsMiddleware: createErrorsMiddleware
}
