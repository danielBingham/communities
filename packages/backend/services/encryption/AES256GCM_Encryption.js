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
const crypto  = require('node:crypto')
const { Buffer } = require('node:buffer')

const ServiceError = require('../../errors/ServiceError')

module.exports = class AES256GCM_Encryption {

    constructor(name, version, config) {

        /**
         * The name of the algorithm config stored in the configuration file.
         */
        this.name = name

        /**
         * The version of the algorithm config stored in the configuration file.
         */
        this.version = version

        /**
         * The Cipher algorithm we want to use.
         */
        this.algorithm = config.algorithm

        /**
         * The length in bytes of the Auth Tag.  Passed to the algorithm.
         */
        this.authTagLength = config.authTagLength

        /**
         * The length in bytes of the Initialization Vector (IV)
         */
        this.initializationVectorLength = config.initializationVectorLength

        /**
         * The length in bytes of the keys. This applies to both the master key and
         * the generated per message keys.
         */
        this.keyLength = config.keyLength

        /**
         * The length in bytes of the salt we will generate to use with the per
         * message key.
         */
        this.saltLength = config.saltLength

        try {
            this.masterKey = Buffer.from(config.key, 'hex')
        } catch (error) {
            throw new ServiceError('invalid-master-key',
                `Master key ${this.name}:${this.version} is invalid.`)
        }

        if ( ! this.masterKey) {
            throw new ServiceError('missing-master-key-version',
                `Master key ${this.name}:${this.version} is missing.`)
        }

        if ( this.masterKey.length !== this.keyLength) {
            throw new ServiceError('invalid-master-key-length',
                `Master key ${this.name}:${this.version} is the wrong length.  Expected ${this.keyLength} bytes length.`)
        }

    }

    async generateKey(salt) {
        const promise = new Promise((resolve, reject) => {
            crypto.hkdf(
                'sha256', this.masterKey, salt, `${this.name}:${this.version}`, this.keyLength, 
                (error, generatedKey) => {
                    if ( error ) {
                        reject(error)
                    }

                    resolve(Buffer.from(generatedKey))
                }
            )
        })

        return await promise
    }

    async encrypt(message, aad) {
        const salt = crypto.randomBytes(this.saltLength)
        const key = await this.generateKey(salt)
        const initializationVector = crypto.randomBytes(this.initializationVectorLength)

        const cipher = crypto.createCipheriv(this.algorithm, key, initializationVector,
            { authTagLength: this.authTagLength })

        if ( aad !== undefined && aad !== null ) {
            cipher.setAAD(aad)
        }

        let encrypted = cipher.update(message, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag()

        const digest = {
            name: this.name,
            version: this.version,
            salt: salt.toString('hex'),
            iv: initializationVector.toString('hex'),
            authTag: authTag.toString('hex'),
            message: encrypted
        }

        return Buffer.from(JSON.stringify(digest), 'utf8').toString('base64')
    }

    async decrypt(message, aad) {
        const digest = JSON.parse(Buffer.from(message, 'base64').toString('utf8'))
        const salt = Buffer.from(digest.salt, 'hex')
        const key = await this.generateKey(salt)
        const iv = Buffer.from(digest.iv, 'hex')
        const authTag = Buffer.from(digest.authTag, 'hex')

        const decipher = crypto.createDecipheriv(this.algorithm, key, iv,
            { authTagLength: this.authTagLength })

        if ( aad !== undefined && aad !== null ) {
            decipher.setAAD(aad)
        }

        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(digest.message, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    }
}
