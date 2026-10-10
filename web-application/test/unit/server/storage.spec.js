/******************************************************************************
 * The route that serves files kept by the filesystem storage driver.
 ******************************************************************************/

const path = require('path')

// The backend's index loads modules jest can't (linkpeek is ESM-only), so
// stand in for it with just what the route uses.
jest.mock('@communities/backend', () => ({
    FilesystemStorage: require('@communities/backend/services/storage/FilesystemStorage')
}))

const { FilesystemStorage } = require('@communities/backend')
const Logger = require('@communities/backend/logger')

const { mountStorageRoute } = require('../../../server/storage')

describe('Stored files route', function() {
    const directory = path.resolve('tmp/storage-route-test')

    let route = null
    let handler = null
    let storage = null

    beforeEach(function() {
        const logger = new Logger()
        logger.level = -1
        const core = { config: { host: 'https://localhost:3000' }, logger: logger }
        storage = core.storage = new FilesystemStorage(core, { directory: directory, secret: 'secret' })

        const app = { get: (path, routeHandler) => { route = path; handler = routeHandler } }
        mountStorageRoute(app, core)
    })

    // A request for `key`, signed unless `query` says otherwise.
    const request = function(key, query) {
        const expires = String(Math.floor(Date.now() / 1000) + 60)
        return {
            params: { key: key.split('/') },
            query: query ?? { expires: expires, signature: storage.sign(key, expires) }
        }
    }

    const response = function() {
        const response = {
            headersSent: false,
            statusCode: 200,
            contentType: null,
            sentFile: null,
            status: jest.fn((code) => { response.statusCode = code; return response }),
            send: jest.fn(() => response),
            type: jest.fn((type) => { response.contentType = type; return response }),
            sendFile: jest.fn((file, callback) => { response.sentFile = file; response.callback = callback })
        }
        return response
    }

    it('Should be mounted on the driver\'s route', function() {
        expect(route).toBe('/api/0.0.0/storage/*key')
    })

    it('Should send the file for a signed link, with its type', function() {
        const res = response()
        handler(request('files/a.mp4'), res)

        expect(res.sentFile).toBe(path.join(directory, 'files/a.mp4'))
        expect(res.contentType).toBe('video/mp4')
        expect(res.status).not.toHaveBeenCalled()
    })

    it('Should answer 404 when the file isn\'t there', function() {
        const res = response()
        handler(request('files/missing.jpeg'), res)
        res.callback(Object.assign(new Error('ENOENT'), { status: 404 }))

        expect(res.statusCode).toBe(404)
    })

    it('Should answer 403 for a missing, wrong or expired signature', function() {
        const expired = String(Math.floor(Date.now() / 1000) - 60)
        for (const query of [
            {},
            { expires: String(Math.floor(Date.now() / 1000) + 60), signature: 'wrong' },
            { expires: expired, signature: storage.sign('files/a.jpeg', expired) }
        ]) {
            const res = response()
            handler(request('files/a.jpeg', query), res)
            expect(res.statusCode).toBe(403)
            expect(res.sendFile).not.toHaveBeenCalled()
        }
    })

    it('Should answer 404 for a key outside the storage folder, even when signed', function() {
        const res = response()
        handler(request('../../.env'), res)

        expect(res.statusCode).toBe(404)
        expect(res.sendFile).not.toHaveBeenCalled()
    })
})
