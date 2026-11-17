const fs = require('fs')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')

const { S3 } = require('@aws-sdk/client-s3')

const Logger = require('../../logger')
const ConfigError = require('../../errors/ConfigError')
const { createStorage, FilesystemStorage, S3Storage } = require('../../services/storage')

describe('Storage', function() {

    const s3Settings = {
        bucket_url: 'https://files.communities.social',
        bucket: 'communities-files',
        access_id: 'id',
        access_key: 'key'
    }

    // What EKS puts in a pod whose ServiceAccount has a Pod Identity
    // association.
    const podIdentity = {
        AWS_CONTAINER_CREDENTIALS_FULL_URI: 'http://169.254.170.23/v1/credentials',
        AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE: '/var/run/secrets/pods.eks.amazonaws.com/serviceaccount/eks-pod-identity-token'
    }

    const withoutKeys = { bucket_url: s3Settings.bucket_url, bucket: s3Settings.bucket }

    const coreWith = function(storage, environment) {
        const logger = new Logger()
        logger.level = -1
        return {
            config: { environment: environment ?? 'development', host: 'https://localhost:3000', storage: storage },
            logger: logger
        }
    }

    describe('createStorage()', function() {
        it('Should create the driver storage.driver names, with its block', function() {
            expect(createStorage(coreWith({ driver: 's3', s3: s3Settings }, 'production'))).toBeInstanceOf(S3Storage)

            const storage = createStorage(coreWith({ driver: 'filesystem', filesystem: { directory: 'tmp/storage', secret: 'secret' } }))
            expect(storage).toBeInstanceOf(FilesystemStorage)
            expect(storage.directory).toBe(path.resolve('tmp/storage'))
        })

        it('Should only allow the filesystem driver in development', function() {
            const storage = { driver: 'filesystem', filesystem: { directory: 'tmp/storage', secret: 'secret' } }
            for (const environment of [ 'staging', 'production' ]) {
                expect(() => createStorage(coreWith(storage, environment))).toThrow(/only be used in development/)
            }
        })

        it('Should reject a missing or unknown driver', function() {
            for (const storage of [ undefined, {}, { driver: 'minio' }, { driver: 'constructor' } ]) {
                expect(() => createStorage(coreWith(storage))).toThrow(/storage\.driver/)
            }
        })
    })

    describe('validateConfig()', function() {
        it('Should require the S3 bucket, and both of its own keys or neither', function() {
            expect(() => S3Storage.validateConfig(s3Settings, 'production')).not.toThrow()
            expect(() => S3Storage.validateConfig(withoutKeys, 'production')).not.toThrow()
            for (const key of [ 'bucket_url', 'bucket' ]) {
                expect(() => S3Storage.validateConfig({ ...s3Settings, [key]: undefined }, 'production')).toThrow(`storage.s3.${key}`)
            }
            for (const key of [ 'access_id', 'access_key' ]) {
                expect(() => S3Storage.validateConfig({ ...s3Settings, [key]: undefined }, 'production'))
                    .toThrow('needs both storage.s3.access_id and storage.s3.access_key, or neither')
            }
            expect(() => S3Storage.validateConfig(undefined, 'production')).toThrow('storage.s3.bucket_url')
        })

        it('Should take link_lifetime as whole seconds, from a minute to 7 days', function() {
            for (const value of [ 60, '60', 3600, 60*60*24*7, String(60*60*24*7), undefined, '' ]) {
                expect(() => S3Storage.validateConfig({ ...s3Settings, link_lifetime: value })).not.toThrow()
                expect(() => FilesystemStorage.validateConfig({ directory: 'tmp', secret: 'secret', link_lifetime: value }, 'development'))
                    .not.toThrow()
            }
            for (const value of [ 59, '59', 60*60*24*7 + 1, 1.5, '1h', '-60', -60, 'NaN', {} ]) {
                expect(() => S3Storage.validateConfig({ ...s3Settings, link_lifetime: value })).toThrow('storage.s3.link_lifetime')
                expect(() => FilesystemStorage.validateConfig({ directory: 'tmp', secret: 'secret', link_lifetime: value }, 'development'))
                    .toThrow('storage.filesystem.link_lifetime')
            }
        })

        it('Should only allow the filesystem driver in development, with a directory and a secret', function() {
            const settings = { directory: 'tmp/storage', secret: 'secret' }
            expect(() => FilesystemStorage.validateConfig(settings, 'development')).not.toThrow()
            expect(() => FilesystemStorage.validateConfig({ secret: 'secret' }, 'development')).toThrow('storage.filesystem.directory')
            expect(() => FilesystemStorage.validateConfig({ directory: 'tmp' }, 'development')).toThrow('storage.filesystem.secret')
            for (const environment of [ 'staging', 'production', undefined ]) {
                expect(() => FilesystemStorage.validateConfig(settings, environment)).toThrow('only be used in development')
            }
        })
    })

    describe('S3Storage', function() {
        it('Should require the bucket, and both of its own keys or neither', function() {
            for (const key of [ 'bucket_url', 'bucket' ]) {
                expect(() => new S3Storage(coreWith(), { ...s3Settings, [key]: undefined })).toThrow(`storage.s3.${key}`)
            }
            for (const key of [ 'access_id', 'access_key' ]) {
                expect(() => new S3Storage(coreWith(), { ...s3Settings, [key]: undefined }, undefined, podIdentity))
                    .toThrow('needs both storage.s3.access_id and storage.s3.access_key')
            }
        })

        it('Should use the environment\'s keys, as Parameter Store does, and say so', async function() {
            const core = coreWith()
            jest.spyOn(core.logger, 'info')

            const env = { AWS_ACCESS_KEY_ID: 'AKIALOCAL', AWS_SECRET_ACCESS_KEY: 'local-secret' }
            const storage = new S3Storage(core, withoutKeys, undefined, env)
            await expect(storage.s3Client.config.credentials()).resolves.toMatchObject({ accessKeyId: 'AKIALOCAL', secretAccessKey: 'local-secret' })
            expect(core.logger.info).toHaveBeenCalledWith('Using S3 with the access keys in AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.')
        })

        it('Should use the pod\'s EKS Pod Identity, as Parameter Store does, and say so', function() {
            const core = coreWith(undefined, 'production')
            jest.spyOn(core.logger, 'info')

            new S3Storage(core, withoutKeys, undefined, podIdentity)
            expect(core.logger.info).toHaveBeenCalledWith('Using S3 with EKS Pod Identity.')
        })

        it('Should use its own keys over the environment\'s, as for an S3-compatible server', async function() {
            const core = coreWith()
            jest.spyOn(core.logger, 'info')

            const env = { ...podIdentity, AWS_ACCESS_KEY_ID: 'AKIALOCAL', AWS_SECRET_ACCESS_KEY: 'local-secret' }
            const storage = new S3Storage(core, s3Settings, undefined, env)
            await expect(storage.s3Client.config.credentials()).resolves.toMatchObject({ accessKeyId: 'id', secretAccessKey: 'key' })
            expect(core.logger.info).toHaveBeenCalledWith('Using S3 with the access keys in storage.s3.access_id and storage.s3.access_key.')
        })

        it('Should refuse to start with neither keys nor Pod Identity', function() {
            expect(() => new S3Storage(coreWith(), withoutKeys, undefined, { AWS_PROFILE: 'developer' }))
                .toThrow(ConfigError)
            expect(() => new S3Storage(coreWith(), withoutKeys, undefined, { AWS_PROFILE: 'developer' }))
                .toThrow(/There are no AWS credentials to use S3 with/)
        })

        it('Should record the bucket URL and allow it and the bucket host as content origins', function() {
            const storage = new S3Storage(coreWith(), s3Settings)
            expect(storage.location).toBe('https://files.communities.social')
            expect(storage.contentOrigins).toEqual([
                'https://files.communities.social',
                'https://communities-files.s3.us-east-1.amazonaws.com'
            ])
        })

        it('Should sign links for the AWS bucket host by default', async function() {
            const url = new URL(await new S3Storage(coreWith(), s3Settings).getSignedUrl('files/a.jpeg'))
            expect(url.origin).toBe('https://communities-files.s3.us-east-1.amazonaws.com')
            expect(url.pathname).toBe('/files/a.jpeg')
            expect(url.searchParams.get('X-Amz-Expires')).toBe(String(60*60*24*7))
        })

        it('Should sign links with keys for 7 days, or link_lifetime, and say how long', async function() {
            const link = await new S3Storage(coreWith(), s3Settings).getSignedLink('files/a.jpeg')
            expect(link.lifetime).toBe(60*60*24*7)
            expect(new URL(link.url).searchParams.get('X-Amz-Expires')).toBe(String(60*60*24*7))
            expect(new URL(link.url).searchParams.get('X-Amz-Security-Token')).toBe(null)

            const short = await new S3Storage(coreWith(), { ...s3Settings, link_lifetime: '120' }).getSignedLink('files/a.jpeg')
            expect(short.lifetime).toBe(120)
            expect(new URL(short.url).searchParams.get('X-Amz-Expires')).toBe('120')
        })

        describe('with expiring credentials, as Pod Identity\'s are', function() {
            // Credentials that expire `minutes` from now, as the Pod Identity
            // agent hands them out.
            const agent = function(minutes) {
                return jest.fn(async () => ({
                    accessKeyId: 'ASIA1', secretAccessKey: 'secret', sessionToken: 'token-1',
                    expiration: new Date(Date.now() + minutes * 60*1000)
                }))
            }

            // A Pod Identity S3Storage whose signing client gets its
            // credentials from `provider`.
            const storageWith = function(provider, settings) {
                const core = coreWith(undefined, 'production')
                const storage = new S3Storage(core, { ...withoutKeys, ...settings }, undefined, podIdentity)
                storage.signingClient = new S3({ region: 'us-east-1', credentials: provider })
                return storage
            }

            const lifetimeOf = (link) => parseInt(new URL(link.url).searchParams.get('X-Amz-Expires'), 10)

            it('Should sign links for link_lifetime, and say so, however soon the credentials expire', async function() {
                for ( const minutes of [ 5*60, 20 ] ) {
                    const provider = agent(minutes)
                    const storage = storageWith(provider)
                    jest.spyOn(storage.core.logger, 'warn')

                    const link = await storage.getSignedLink('files/a.jpeg')
                    expect(link.lifetime).toBe(60*60*24*7)
                    expect(lifetimeOf(link)).toBe(60*60*24*7)
                    expect(new URL(link.url).searchParams.get('X-Amz-Security-Token')).toBe('token-1')

                    // The credentials are the SDK's business: a link that
                    // stops working when they expire is the client's to
                    // replace (File in web-application/client).
                    expect(provider.mock.calls.some(([ options ]) => options?.forceRefresh)).toBe(false)
                    expect(storage.core.logger.warn).not.toHaveBeenCalled()
                }
            })

            it('Should sign links for link_lifetime when it is set', async function() {
                const link = await storageWith(agent(5*60), { link_lifetime: 120 }).getSignedLink('files/a.jpeg')
                expect(link.lifetime).toBe(120)
                expect(lifetimeOf(link)).toBe(120)
            })

            it('Should return null, and log, when it can\'t get credentials to sign with', async function() {
                const storage = storageWith(jest.fn(async () => { throw new Error('agent unreachable') }))
                jest.spyOn(storage.core.logger, 'error')

                expect(await storage.getSignedLink('files/a.jpeg')).toBe(null)
                expect(await storage.getSignedUrl('files/a.jpeg')).toBe(null)
                expect(storage.core.logger.error).toHaveBeenCalled()
            })
        })

        it('Should use an S3-compatible endpoint, with path-style addressing and a public endpoint for links', async function() {
            const local = { ...s3Settings, bucket_url: 'http://localhost:3900/communities', bucket: 'communities', endpoint: 'http://garage:3900', public_endpoint: 'http://localhost:3900', region: 'garage' }

            const storage = new S3Storage(coreWith(), local)
            const url = new URL(await storage.getSignedUrl('files/a.jpeg'))
            expect(url.origin).toBe('http://localhost:3900')
            expect(url.pathname).toBe('/communities/files/a.jpeg')
            expect(url.searchParams.get('X-Amz-Credential')).toContain('/garage/s3/')
            expect(storage.contentOrigins).toEqual([ 'http://localhost:3900/communities', 'http://localhost:3900' ])

            const withoutPublic = new S3Storage(coreWith(), { ...local, public_endpoint: undefined })
            expect(new URL(await withoutPublic.getSignedUrl('files/a.jpeg')).origin).toBe('http://garage:3900')
            expect(withoutPublic.contentOrigins).toEqual([ 'http://localhost:3900/communities', 'http://garage:3900' ])
        })

        it('Should report a missing object as not there', async function() {
            const missing = Object.assign(new Error('NotFound'), { $metadata: { httpStatusCode: 404 } })
            const client = { send: jest.fn(async () => { throw missing }) }
            expect(await new S3Storage(coreWith(), s3Settings, client).hasFile('files/a.jpeg')).toBe(false)

            client.send = jest.fn(async () => ({ $metadata: { httpStatusCode: 200 } }))
            expect(await new S3Storage(coreWith(), s3Settings, client).hasFile('files/a.jpeg')).toBe(true)
        })

        it('Should upload a buffer with its length and content type', async function() {
            const client = { send: jest.fn(async () => ({ $metadata: { httpStatusCode: 200 } })) }
            const storage = new S3Storage(coreWith(), s3Settings, client)

            await storage.uploadFileFromBuffer(Buffer.from('{}'), 'news/index.json', 'application/json')
            expect(client.send).toHaveBeenCalledTimes(1)
            expect(client.send.mock.calls[0][0].input).toEqual({
                Bucket: 'communities-files',
                Key: 'news/index.json',
                Body: Buffer.from('{}'),
                ContentType: 'application/json'
            })

            await storage.uploadFileFromBuffer(Buffer.from('image'), 'files/a.jpeg')
            expect(client.send.mock.calls[1][0].input).toEqual({
                Bucket: 'communities-files',
                Key: 'files/a.jpeg',
                Body: Buffer.from('image')
            })
        })
    })

    describe('FilesystemStorage', function() {
        let directory = null
        let storage = null

        beforeEach(function() {
            directory = fs.mkdtempSync(path.join(os.tmpdir(), 'communities-storage-'))
            storage = new FilesystemStorage(coreWith(), { directory: path.join(directory, 'storage'), secret: 'secret' })
        })

        afterEach(function() {
            fs.rmSync(directory, { recursive: true, force: true })
        })

        const local = (name, contents) => {
            const file = path.join(directory, name)
            if ( contents !== undefined ) {
                fs.writeFileSync(file, contents)
            }
            return file
        }

        it('Should require a directory and a secret', function() {
            expect(() => new FilesystemStorage(coreWith(), { secret: 'secret' })).toThrow('storage.filesystem.directory')
            expect(() => new FilesystemStorage(coreWith(), { directory: 'tmp' })).toThrow('storage.filesystem.secret')
        })

        it('Should keep each key as a file under the directory', async function() {
            await storage.uploadFile(local('upload.jpeg', 'image'), 'files/a.jpeg')
            expect(fs.readFileSync(path.join(directory, 'storage/files/a.jpeg'), 'utf8')).toBe('image')
            expect(await storage.hasFile('files/a.jpeg')).toBe(true)
            expect(Buffer.from(await storage.getFile('files/a.jpeg')).toString()).toBe('image')

            await storage.downloadFile('files/a.jpeg', local('download.jpeg'))
            expect(fs.readFileSync(local('download.jpeg'), 'utf8')).toBe('image')

            await storage.uploadFileFromStream(Readable.from([ 'streamed' ]), 'files/b.jpeg')
            expect(Buffer.from(await storage.getFile('files/b.jpeg')).toString()).toBe('streamed')

            await storage.uploadFileFromBuffer(Buffer.from('buffered'), 'files/c.json', 'application/json')
            expect(Buffer.from(await storage.getFile('files/c.json')).toString()).toBe('buffered')

            // Uploading again replaces the file.
            await storage.uploadFileFromBuffer(Buffer.from('replaced'), 'files/c.json', 'application/json')
            expect(Buffer.from(await storage.getFile('files/c.json')).toString()).toBe('replaced')

            // Written to a temporary name, then renamed: nothing is left over.
            expect(fs.readdirSync(path.join(directory, 'storage/files')).sort()).toEqual([ 'a.jpeg', 'b.jpeg', 'c.json' ])
        })

        it('Should copy, move and remove files', async function() {
            await storage.uploadFile(local('upload.jpeg', 'image'), 'files/a.jpeg')

            await storage.copyFile('files/a.jpeg', 'files/copy.jpeg')
            expect(await storage.hasFile('files/a.jpeg')).toBe(true)
            expect(await storage.hasFile('files/copy.jpeg')).toBe(true)

            await storage.moveFile('files/a.jpeg', 'files/a.orig.jpeg')
            expect(await storage.hasFile('files/a.jpeg')).toBe(false)
            expect(await storage.hasFile('files/a.orig.jpeg')).toBe(true)

            await storage.removeFile('files/a.orig.jpeg')
            expect(await storage.hasFile('files/a.orig.jpeg')).toBe(false)

            // Like S3, removing a file that isn't there isn't an error.
            await expect(storage.removeFile('files/a.orig.jpeg')).resolves.toBeUndefined()
        })

        it('Should refuse keys outside the directory', async function() {
            for (const key of [ '../outside.jpeg', 'files/../../outside.jpeg', '/etc/passwd', '', '.', undefined, [ 'files/a.jpeg' ] ]) {
                expect(() => storage.pathFor(key)).toThrow(/isn't a valid storage key/)
            }
            await expect(storage.uploadFile(local('upload.jpeg', 'image'), '../outside.jpeg')).rejects.toThrow(/isn't a valid storage key/)
            expect(fs.existsSync(path.join(directory, 'outside.jpeg'))).toBe(false)

            expect(storage.pathFor('files/a.jpeg')).toBe(path.join(directory, 'storage/files/a.jpeg'))
        })

        it('Should sign links for 7 days, or link_lifetime, and say how long', async function() {
            const link = await storage.getSignedLink('files/a.jpeg')
            expect(link.lifetime).toBe(60*60*24*7)
            expect(link.url).toBe(await storage.getSignedUrl('files/a.jpeg'))

            const short = new FilesystemStorage(coreWith(), { directory: directory, secret: 'secret', link_lifetime: '60' })
            const shortLink = await short.getSignedLink('files/a.jpeg')
            expect(shortLink.lifetime).toBe(60)
            expect(parseInt(new URL(shortLink.url).searchParams.get('expires'), 10) - Date.now() / 1000).toBeCloseTo(60, -1)
        })

        it('Should sign links to its route on the app host, good for 7 days', async function() {
            const url = new URL(await storage.getSignedUrl('files/a b.jpeg'))
            expect(url.origin).toBe('https://localhost:3000')
            expect(url.pathname).toBe('/api/0.0.0/storage/files/a%20b.jpeg')

            const expires = url.searchParams.get('expires')
            const signature = url.searchParams.get('signature')
            expect(parseInt(expires, 10) - Date.now() / 1000).toBeCloseTo(60*60*24*7, -1)

            expect(storage.verify('files/a b.jpeg', expires, signature)).toBe(true)
            expect(storage.verify('files/b.jpeg', expires, signature)).toBe(false)
            expect(storage.verify('files/a b.jpeg', String(parseInt(expires, 10) + 1), signature)).toBe(false)
            expect(storage.verify('files/a b.jpeg', expires, signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A'))).toBe(false)
            expect(storage.verify('files/a b.jpeg', [ expires ], signature)).toBe(false)
            expect(storage.verify('files/a b.jpeg', expires, undefined)).toBe(false)

            const other = new FilesystemStorage(coreWith(), { directory: directory, secret: 'another secret' })
            expect(other.verify('files/a b.jpeg', expires, signature)).toBe(false)
        })

        it('Should refuse an expired link', function() {
            const expired = String(Math.floor(Date.now() / 1000) - 1)
            expect(storage.verify('files/a.jpeg', expired, storage.sign('files/a.jpeg', expired))).toBe(false)
            expect(storage.verify('files/a.jpeg', '1e12', storage.sign('files/a.jpeg', '1e12'))).toBe(false)
        })

        it('Should record its route as the location and need no extra content origins', function() {
            expect(storage.location).toBe('https://localhost:3000/api/0.0.0/storage')
            expect(storage.contentOrigins).toEqual([])
        })
    })
})
