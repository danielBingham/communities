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
const crypto = require('node:crypto')

// 128 bytes is 1024 bits.  Seems like enough.
const DEFAULT_LENGTH = 128 

module.exports = class TokenService {

    constructor(core) {
        this.core = core
    }

    createToken(size) {
        const length = size || DEFAULT_LENGTH
        const buffer = crypto.randomBytes(length)
        return buffer.toString('base64')
    }

    createURLSafeToken(size) {
        const length = size || DEFAULT_LENGTH
        const buffer = crypto.randomBytes(length)
        return buffer.toString('base64url')
    }
}
