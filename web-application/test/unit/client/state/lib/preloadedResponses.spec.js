/**
 * @jest-environment node
 */
/******************************************************************************
 * Preloaded responses: the API responses the server sends with a page, which
 * makeRequest() answers the page's requests from instead of the network.
 *
 * Runs in node, which has fetch's Response (jsdom doesn't), with just enough
 * of a document for the module to find the page's <script>.
 ******************************************************************************/

jest.mock('/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn(), verbose: jest.fn() }
}))

jest.mock('@capacitor/core', () => ({
    Capacitor: { getPlatform: () => 'web' }
}))

jest.mock('capacitor-secure-storage-plugin', () => ({
    SecureStoragePlugin: {}
}))

const shared = require('@communities/shared')

const ELEMENT_ID = shared.lib.preloadedResponses.ELEMENT_ID

describe('Preloaded responses', function() {
    let preloadedResponses = null
    let makeRequest = null
    let logger = null

    // Load the modules fresh, for a page with `json` as its preloaded
    // responses' <script>, or no <script> when it's null.
    const loadPage = function(json) {
        jest.resetModules()

        global.document = {
            getElementById: (id) => ( id === ELEMENT_ID && json !== null ) ? { textContent: json } : null
        }

        preloadedResponses = require('../../../../../client/state/lib/preloadedResponses')
        makeRequest = require('../../../../../client/state/lib/makeRequest').makeRequest
        logger = require('/logger').default
    }

    const news = {
        title: 'A Post',
        slug: 'a-post',
        date: '09/29/2026',
        author: 'Daniel Bingham',
        content: 'Some </script> <!-- tricky --> content.'
    }

    const page = {
        'GET /news/a-post': { status: 200, body: { entity: news, relations: {} } },
        'GET /news?page=2': { status: 200, body: { dictionary: {}, list: [], meta: { page: 2 }, relations: {} } },
        'GET /news/missing': { status: 404, body: { error: { type: 'not-found', message: 'That resource doesn\'t exist.' } } }
    }

    // As PageController renders it.
    const pageJSON = JSON.stringify(page).replace(/</g, '\\u003c')

    beforeEach(function() {
        jest.spyOn(performance, 'now').mockReturnValue(1000)
        global.fetch = jest.fn(async () => new Response(JSON.stringify({ from: 'network' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }))
    })

    afterEach(function() {
        jest.restoreAllMocks()
        delete global.document
        delete global.fetch
    })

    describe('takePreloadedResponse()', function() {
        it('Should answer a request the page came with a response for, once', async function() {
            loadPage(pageJSON)

            const response = preloadedResponses.takePreloadedResponse('GET', '/news/a-post')
            expect(response).toBeInstanceOf(Response)
            expect(response.status).toBe(200)
            expect(response.ok).toBe(true)
            expect(await response.json()).toEqual({ entity: news, relations: {} })

            expect(preloadedResponses.takePreloadedResponse('GET', '/news/a-post')).toBeNull()
        })

        it('Should keep what the server escaped intact', async function() {
            loadPage(pageJSON)
            expect(pageJSON).not.toContain('</script>')

            const body = await preloadedResponses.takePreloadedResponse('GET', '/news/a-post').json()
            expect(body.entity.content).toBe('Some </script> <!-- tricky --> content.')
        })

        it('Should match the request however its query is written', function() {
            loadPage(JSON.stringify({ 'GET /users?name=dan&page=2': { status: 200, body: {} } }))

            expect(preloadedResponses.takePreloadedResponse('GET', '/users?page=2&name=dan')).not.toBeNull()
        })

        it('Should only answer requests the page came with responses for', function() {
            loadPage(pageJSON)

            expect(preloadedResponses.takePreloadedResponse('GET', '/news/another-post')).toBeNull()
            expect(preloadedResponses.takePreloadedResponse('GET', '/news?page=1')).toBeNull()
            expect(preloadedResponses.takePreloadedResponse('POST', '/news/a-post')).toBeNull()
        })

        it('Should answer nothing when the page came without responses', function() {
            loadPage(null)
            expect(preloadedResponses.takePreloadedResponse('GET', '/news/a-post')).toBeNull()
        })

        it('Should answer nothing once the page has been open too long', function() {
            loadPage(pageJSON)
            performance.now.mockReturnValue(preloadedResponses.MAX_AGE + 1)

            expect(preloadedResponses.takePreloadedResponse('GET', '/news/a-post')).toBeNull()

            // And they're gone for good.
            performance.now.mockReturnValue(1000)
            expect(preloadedResponses.takePreloadedResponse('GET', '/news/a-post')).toBeNull()
        })

        it('Should ignore a <script> it can\'t read', function() {
            loadPage('{ not json')

            expect(preloadedResponses.takePreloadedResponse('GET', '/news/a-post')).toBeNull()
            expect(logger.warn).toHaveBeenCalled()
        })

        it('Should leave out anything that isn\'t a response', function() {
            loadPage(JSON.stringify({
                'GET /a': { status: 200, body: { ok: true } },
                'GET /b': { status: 99, body: {} },
                'GET /c': { status: '200', body: {} },
                'GET /d': { status: 200 },
                'GET /e': null
            }))

            expect(preloadedResponses.takePreloadedResponse('GET', '/a')).not.toBeNull()
            for(const endpoint of [ '/b', '/c', '/d', '/e' ]) {
                expect(preloadedResponses.takePreloadedResponse('GET', endpoint)).toBeNull()
            }
        })
    })

    describe('makeRequest()', function() {
        const getState = () => ({ system: { api: 'https://localhost:3000/api/0.0.0/', csrf: null } })

        const request = async function(method, endpoint, options) {
            const onSuccess = jest.fn()
            const onFailure = jest.fn()
            const [ promise ] = makeRequest(method, endpoint, null, onSuccess, onFailure, options)(jest.fn(), getState)
            const result = await promise
            return { result, onSuccess, onFailure }
        }

        it('Should answer from the preloaded response without going to the network', async function() {
            loadPage(pageJSON)

            const { result, onSuccess, onFailure } = await request('GET', '/news/a-post')

            expect(global.fetch).not.toHaveBeenCalled()
            expect(onSuccess).toHaveBeenCalledWith({ entity: news, relations: {} })
            expect(onFailure).not.toHaveBeenCalled()
            expect(result).toEqual({
                success: true,
                request: { endpoint: '/news/a-post', method: 'GET' },
                response: { status: 200, body: { entity: news, relations: {} } },
                error: null
            })
        })

        it('Should go to the network the second time', async function() {
            loadPage(pageJSON)

            await request('GET', '/news/a-post')
            const { onSuccess } = await request('GET', '/news/a-post')

            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(global.fetch.mock.calls[0][0]).toBe('https://localhost:3000/api/0.0.0/news/a-post')
            expect(onSuccess).toHaveBeenCalledWith({ from: 'network' })
        })

        it('Should handle a preloaded failure as a failure', async function() {
            loadPage(pageJSON)

            const { result, onSuccess, onFailure } = await request('GET', '/news/missing')

            expect(global.fetch).not.toHaveBeenCalled()
            expect(onSuccess).not.toHaveBeenCalled()
            expect(onFailure).toHaveBeenCalledWith(404, page['GET /news/missing'].body)
            expect(result.success).toBe(false)
            expect(result.error.type).toBe('not-found')
        })

        it('Should only use preloaded responses for GET requests', async function() {
            loadPage(JSON.stringify({ 'DELETE /news/a-post': { status: 200, body: {} } }))

            await request('DELETE', '/news/a-post')
            expect(global.fetch).toHaveBeenCalledTimes(1)
        })

        it('Should leave the preloaded response alone for a request that isn\'t for it', async function() {
            loadPage(pageJSON)

            await request('PATCH', '/news/a-post')
            await request('GET', '/news/a-post', { isFile: true })
            expect(global.fetch).toHaveBeenCalledTimes(2)

            await request('GET', '/news/a-post')
            expect(global.fetch).toHaveBeenCalledTimes(2)
        })

        it('Should go to the network when the page came without responses', async function() {
            loadPage(null)

            const { onSuccess } = await request('GET', '/news/a-post')
            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(onSuccess).toHaveBeenCalledWith({ from: 'network' })
        })
    })
})
