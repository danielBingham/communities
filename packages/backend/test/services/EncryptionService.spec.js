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
const Logger = require('../../logger')
const ServiceError = require('../../errors/ServiceError')
const EncryptionService = require('../../services/EncryptionService')

describe('EncryptionService', function() {

    describe('encrypt()', function() {
        
        it('Should return a base64 encoded digest', async function() {
            const core = {
                logger: new Logger(),
                config: {
                    encryption: {
                        mfa: {
                            v1: {
                                key: '1eec7f1b6091551f22b99c29808cc119f5a2d0617f51904a3a2db1f30561045b',
                                algorithm: 'aes-256-gcm',
                                authTagLength: 16,
                                initializationVectorLength: 12,
                                keyLength: 32,
                                saltLength: 32
                            }
                        }
                    }
                }
            }
            core.logger.level = -1

            const message = 'hello world!'
            const id = 'c69ba3f2-e537-4f7c-853c-1f11f1548611'

            const encryptionService = new EncryptionService(core)
            const result = await encryptionService.encrypt(message, id, 'mfa', 'v1') 
            
            const digest = JSON.parse(Buffer.from(result, 'base64').toString('utf8'))

            expect(digest.name).toBe('mfa')
            expect(digest.version).toBe('v1')
        })

    })

    describe('decrypt()', function() {

        it('Should successfully round trip an encrypted message', async function() {
            const core = {
                logger: new Logger(),
                config: {
                    encryption: {
                        mfa: {
                            v1: {
                                key: '1eec7f1b6091551f22b99c29808cc119f5a2d0617f51904a3a2db1f30561045b',
                                algorithm: 'aes-256-gcm',
                                authTagLength: 16,
                                initializationVectorLength: 12,
                                keyLength: 32,
                                saltLength: 32
                            }
                        }
                    }
                }
            }
            core.logger.level = -1

            const message = 'hello world!'
            const id = 'c69ba3f2-e537-4f7c-853c-1f11f1548611'

            const encryptionService = new EncryptionService(core)
            const encrypted = await encryptionService.encrypt(message, id, 'mfa', 'v1') 
            const result = await encryptionService.decrypt(encrypted, id, 'mfa', 'v1')

            expect(result).toBe(message)
        })

        it('should fail when the message is tampered with', async function() {
            const core = {
                logger: new Logger(),
                config: {
                    encryption: {
                        mfa: {
                            v1: {
                                key: '1eec7f1b6091551f22b99c29808cc119f5a2d0617f51904a3a2db1f30561045b',
                                algorithm: 'aes-256-gcm',
                                authTagLength: 16,
                                initializationVectorLength: 12,
                                keyLength: 32,
                                saltLength: 32
                            }
                        }
                    }
                }
            }
            core.logger.level = -1


            const message = 'hello world!'
            const id = 'c69ba3f2-e537-4f7c-853c-1f11f1548611'

            const encryptionService = new EncryptionService(core)
            const encrypted = await encryptionService.encrypt(message, id, 'mfa', 'v1') 

            const digest = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf8'))
            digest.message = digest.message.substring(0, digest.message.length-1)+'e'
            const tampered = Buffer.from(JSON.stringify(digest), 'utf8').toString('base64')

            try { 
                const result = await encryptionService.decrypt(tampered, id, 'mfa', 'v1')
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('decryption-failed')
            }

            expect.hasAssertions()
        })

        it('should fail when the id is different', async function() {
            const core = {
                logger: new Logger(),
                config: {
                    encryption: {
                        mfa: {
                            v1: {
                                key: '1eec7f1b6091551f22b99c29808cc119f5a2d0617f51904a3a2db1f30561045b',
                                algorithm: 'aes-256-gcm',
                                authTagLength: 16,
                                initializationVectorLength: 12,
                                keyLength: 32,
                                saltLength: 32
                            }
                        }
                    }
                }
            }
            core.logger.level = -1

            const message = 'hello world!'
            const id = 'c69ba3f2-e537-4f7c-853c-1f11f1548611'

            const encryptionService = new EncryptionService(core)
            const encrypted = await encryptionService.encrypt(message, id, 'mfa', 'v1') 

            try { 
                const result = await encryptionService.decrypt(encrypted, '1bca2539-6db2-44db-a4f1-1896e6720fa4', 'mfa', 'v1')
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('decryption-failed')
            }

            expect.hasAssertions()
        })

        it('should fail when the version is different', async function() {
            const core = {
                logger: new Logger(),
                config: {
                    encryption: {
                        mfa: {
                            v1: {
                                key: '1eec7f1b6091551f22b99c29808cc119f5a2d0617f51904a3a2db1f30561045b',
                                algorithm: 'aes-256-gcm',
                                authTagLength: 16,
                                initializationVectorLength: 12,
                                keyLength: 32,
                                saltLength: 32
                            },
                            v2: {
                                key: '1eec7f1b6091551f22b99c29808cc119f5a2d0617f51904a3a2db1f30561045b',
                                algorithm: 'aes-256-gcm',
                                authTagLength: 16,
                                initializationVectorLength: 12,
                                keyLength: 32,
                                saltLength: 32
                            }
                        }
                    }
                }
            }
            core.logger.level = -1

            const message = 'hello world!'
            const id = 'c69ba3f2-e537-4f7c-853c-1f11f1548611'

            const encryptionService = new EncryptionService(core)
            const encrypted = await encryptionService.encrypt(message, id, 'mfa', 'v1') 

            try { 
                const result = await encryptionService.decrypt(encrypted, id, 'mfa', 'v2')
            } catch (error) {
                expect(error).toBeInstanceOf(ServiceError)
                expect(error.type).toBe('decryption-failed')
            }

            expect.hasAssertions()
        })
    })
    
})
