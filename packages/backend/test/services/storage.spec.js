const fs = require('fs')
const os = require('os')
const path = require('path')
const { Readable } = require('stream')

const Logger = require('../../logger')
const { createStorage, FilesystemStorage, S3Storage } = require('../../services/storage')

describe('Storage', function() {

    const s3Settings = {
        bucket_url: 'https://files.communities.social',
        bucket: 'communities-files',
        access_id: 'id',
        access_key: 'key'
    }

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

    describe('S3Storage', function() {
        it('Should require the bucket and its credentials', function() {
            for (const key of Object.keys(s3Settings)) {
                const settings = { ...s3Settings, [key]: undefined }
                expect(() => new S3Storage(coreWith(), settings)).toThrow(`storage.s3.${key}`)
            }
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

            // Written to a temporary name, then renamed: nothing is left over.
            expect(fs.readdirSync(path.join(directory, 'storage/files')).sort()).toEqual([ 'a.jpeg', 'b.jpeg' ])
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
