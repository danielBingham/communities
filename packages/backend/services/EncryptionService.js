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

const ServiceError = require('../errors/ServiceError')

const AES256GCM_Encryption = require('./encryption/AES256GCM_Encryption')

module.exports = class EncryptionService {

    constructor(core) {
        this.core = core
    }


    async encrypt(message, aad, name, version) {
        if ( ! (name in this.core.config.encryption ) ) {
            throw new ServiceError('missing-name',
                `Couldn't find an algorithm configuration for ${name}.`)
        }

        if ( ! (version in this.core.config.encryption[name] )) {
            throw new ServiceError('missing-version',
                `Couldn't find an algorithm configuration for ${name}:${version}.`)
        }

        const config = this.core.config.encryption[name][version]

        if ( config.algorithm === 'aes-256-gcm' ) {
            try { 
                const algorithm = new AES256GCM_Encryption(name, version, config)
                return await algorithm.encrypt(message, aad)
            } catch (error) {
                this.core.logger.error(error)
                throw new ServiceError('encryption-failed',
                    `Encryption failed.`)
            }
        }

        throw new ServiceError('invalid-algorithm',
            `'${config.algorithm}' is not a valid algorithm.`)
        
    }

    async decrypt(message, aad, name, version) {
        if ( ! (name in this.core.config.encryption ) ) {
            throw new ServiceError('missing-name',
                `Couldn't find an algorithm configuration for ${name}.`)
        }

        if ( ! (version in this.core.config.encryption[name] )) {
            throw new ServiceError('missing-version',
                `Couldn't find an algorithm configuration for ${name}:${version}.`)
        }

        const config = this.core.config.encryption[name][version]

        if ( config.algorithm === 'aes-256-gcm' ) {
            try { 
                const algorithm = new AES256GCM_Encryption(name, version, config)
                return await algorithm.decrypt(message, aad)
            } catch (error) {
                this.core.logger.error(error)
                throw new ServiceError('decryption-failed',
                    `Decryption failed.`)
            }
        }

        throw new ServiceError('invalid-algorithm',
            `'${config.algorithm}' is not a valid algorithm.`)
    }
}
