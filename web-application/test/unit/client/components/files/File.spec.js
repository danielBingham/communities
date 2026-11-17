/**
 * @jest-environment jsdom
 */
/******************************************************************************
 * Files whose links run out: File asks for a new link when a file fails to
 * load, useFileSource replaces a link that's due before showing it, and
 * Video picks up where it was with a new link to the same video.
 ******************************************************************************/

jest.mock('/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn(), verbose: jest.fn() }
}))

// Requests wait until the test answers them.
const mockRequests = []
jest.mock('/state/lib/makeRequest', () => ({
    makeRequest: (method, endpoint, body, onSuccess, onFailure) => function() {
        let resolve = null
        const promise = new Promise((r) => { resolve = r })
        mockRequests.push({
            method, endpoint,
            respond: (response) => { onSuccess(response); resolve({ success: true }) },
            fail: (status) => { onFailure(status, {}); resolve({ success: false }) }
        })
        return [ promise, new AbortController() ]
    }
}))

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import FileReducer, { setFilesInDictionary } from '/state/File'
import { setSources } from '/state/File/slice'
import File from '/components/files/File/File'
import Video from '/components/ui/Video'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Files whose links run out', function() {

    const image = { id: 'f', type: 'image/jpeg', kind: 'image', variants: [ '650' ] }
    const later = () => Date.now() + 60*60*1000

    let container = null
    let root = null

    beforeEach(function() {
        mockRequests.length = 0
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(async function() {
        await act(async () => root.unmount())
        container.remove()
        jest.restoreAllMocks()
    })

    const storeWith = function(file, sources, refreshTimes) {
        const store = configureStore({
            reducer: {
                File: FileReducer,
                system: (state = { features: { 'video-uploads': { status: 'enabled' } } }) => state
            }
        })
        store.dispatch(setFilesInDictionary({ entity: file }))
        store.dispatch(setSources({ fileId: file.id, sources: sources, refreshTimes: refreshTimes }))
        return store
    }

    const render = async function(element, store) {
        await act(async () => root.render(store ? <Provider store={store}>{element}</Provider> : element))
    }

    const fire = async function(element, type) {
        await act(async () => element.dispatchEvent(new Event(type)))
    }

    describe('File', function() {
        it('Should ask for a new link when an image fails to load, and show it', async function() {
            const onError = jest.fn()
            await render(<File id="f" width={650} onError={onError} />, storeWith(image, { 650: 'https://s3/a1' }, { 650: later() }))
            expect(container.querySelector('img').getAttribute('src')).toBe('https://s3/a1')
            expect(mockRequests).toHaveLength(0)

            await fire(container.querySelector('img'), 'error')
            expect(mockRequests).toHaveLength(1)
            expect(mockRequests[0]).toMatchObject({ method: 'GET', endpoint: '/file/f/source?variant=650' })

            await act(async () => mockRequests[0].respond({
                entity: image, sources: { 650: 'https://s3/a2' }, sourceLifetimes: { 650: 3600 }, relations: {}
            }))
            expect(container.querySelector('img').getAttribute('src')).toBe('https://s3/a2')
            expect(onError).not.toHaveBeenCalled()
        })

        it('Should give up when the new link fails too, and try again after a minute', async function() {
            const now = jest.spyOn(Date, 'now')
            const start = Date.now()
            now.mockReturnValue(start)

            const onError = jest.fn()
            await render(<File id="f" width={650} onError={onError} />, storeWith(image, { 650: 'https://s3/a1' }, { 650: start + 3600*1000 }))

            await fire(container.querySelector('img'), 'error')
            await act(async () => mockRequests[0].respond({
                entity: image, sources: { 650: 'https://s3/a2' }, sourceLifetimes: { 650: 3600 }, relations: {}
            }))

            now.mockReturnValue(start + 5*1000)
            await fire(container.querySelector('img'), 'error')
            expect(mockRequests).toHaveLength(1)
            expect(onError).toHaveBeenCalledTimes(1)

            now.mockReturnValue(start + 61*1000)
            await fire(container.querySelector('img'), 'error')
            expect(mockRequests).toHaveLength(2)
            expect(onError).toHaveBeenCalledTimes(1)
        })

        it('Should ask for a new link to the full file when that\'s what it shows', async function() {
            await render(<File id="f" width={650} />, storeWith(image, { 650: null, full: 'https://s3/full1' }, { full: later() }))
            expect(container.querySelector('img').getAttribute('src')).toBe('https://s3/full1')

            await fire(container.querySelector('img'), 'error')
            expect(mockRequests.map((r) => r.endpoint)).toEqual([ '/file/f/source?variant=full' ])
        })

        it('Should replace a link that\'s due before showing it', async function() {
            await render(<File id="f" width={650} />, storeWith(image, { 650: 'https://s3/old' }, { 650: Date.now() - 1 }))
            expect(container.querySelector('img')).toBe(null)
            expect(container.querySelector('[role="status"]')).not.toBe(null)
            expect(mockRequests.map((r) => r.endpoint)).toEqual([ '/file/f/source?variant=650' ])

            await act(async () => mockRequests[0].respond({
                entity: image, sources: { 650: 'https://s3/new' }, sourceLifetimes: { 650: 3600 }, relations: {}
            }))
            expect(container.querySelector('img').getAttribute('src')).toBe('https://s3/new')
            expect(mockRequests).toHaveLength(1)
        })

        it('Should keep a link without a refresh time, as from an older server', async function() {
            await render(<File id="f" width={650} />, storeWith(image, { 650: 'https://s3/a1' }))
            expect(container.querySelector('img').getAttribute('src')).toBe('https://s3/a1')
            expect(mockRequests).toHaveLength(0)
        })

        it('Should fall back on the full file when a new link can\'t be had', async function() {
            await render(<File id="f" width={650} />, storeWith(image, { 650: 'https://s3/a1' }, { 650: later() }))
            await fire(container.querySelector('img'), 'error')
            await act(async () => mockRequests[0].fail(404))

            expect(mockRequests.map((r) => r.endpoint)).toEqual([ '/file/f/source?variant=650', '/file/f/source?variant=full' ])
        })

        it('Should ask for a new link to a video\'s poster when it fails to load', async function() {
            const video = { id: 'v', type: 'video/mp4', kind: 'video', variants: [ '650' ], thumbId: 't' }
            const thumbnail = { id: 't', type: 'image/jpeg', kind: 'image', variants: [ '650' ] }
            const store = storeWith(video, { 650: 'https://s3/v1' }, { 650: later() })
            store.dispatch(setFilesInDictionary({ entity: thumbnail }))
            store.dispatch(setSources({ fileId: 't', sources: { 650: 'https://s3/t1' }, refreshTimes: { 650: later() } }))

            await render(<File id="v" width={650} />, store)
            const poster = container.querySelector('img.video__poster__image')
            expect(poster.getAttribute('src')).toBe('https://s3/t1')

            await fire(poster, 'error')
            expect(mockRequests.map((r) => r.endpoint)).toEqual([ '/file/t/source?variant=650' ])
            await act(async () => mockRequests[0].respond({
                entity: thumbnail, sources: { 650: 'https://s3/t2' }, sourceLifetimes: { 650: 3600 }, relations: {}
            }))
            expect(container.querySelector('img.video__poster__image').getAttribute('src')).toBe('https://s3/t2')
        })
    })

    describe('Video', function() {
        beforeEach(function() {
            jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function() { return Promise.resolve() })
            jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(function() {})
        })

        // Play the video as a person would, and have it get 42 seconds in.
        const playTo42 = async function() {
            await act(async () => container.querySelector('[role="button"]').click())
            const element = container.querySelector('video')
            await fire(element, 'play')
            Object.defineProperty(element, 'currentTime', { value: 42, writable: true, configurable: true })
            return element
        }

        it('Should go back to where it was, playing, with a new link to the same video', async function() {
            const onError = jest.fn()
            await render(<Video src="https://s3/v1" mediaKey="v/650" playOverlay={true} onError={onError} />)
            const element = await playTo42()
            expect(element.play).toHaveBeenCalledTimes(1)

            await fire(element, 'error')
            expect(onError).toHaveBeenCalledTimes(1)

            await render(<Video src="https://s3/v2" mediaKey="v/650" playOverlay={true} onError={onError} />)
            expect(container.querySelector('[role="button"]')).toBe(null)
            expect(container.querySelector('video')).toBe(element)
            expect(element.getAttribute('src')).toBe('https://s3/v2')

            Object.defineProperty(element, 'currentTime', { value: 0, writable: true, configurable: true })
            await fire(element, 'loadedmetadata')
            expect(element.currentTime).toBe(42)
            expect(element.play).toHaveBeenCalledTimes(2)
        })

        it('Should stay paused if it was paused', async function() {
            await render(<Video src="https://s3/v1" mediaKey="v/650" playOverlay={true} />)
            const element = await playTo42()
            await fire(element, 'pause')
            jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 5000)

            await fire(element, 'error')
            await render(<Video src="https://s3/v2" mediaKey="v/650" playOverlay={true} />)
            await fire(element, 'loadedmetadata')
            expect(element.currentTime).toBe(42)
            expect(element.play).toHaveBeenCalledTimes(1)
        })

        it('Should start over for another video', async function() {
            await render(<Video src="https://s3/v1" mediaKey="v/650" playOverlay={true} />)
            const element = await playTo42()
            await fire(element, 'error')

            await render(<Video src="https://s3/w1" mediaKey="w/650" playOverlay={true} />)
            expect(container.querySelector('[role="button"]')).not.toBe(null)
            Object.defineProperty(element, 'currentTime', { value: 0, writable: true, configurable: true })
            await fire(container.querySelector('video'), 'loadedmetadata')
            expect(container.querySelector('video').currentTime).toBe(0)
            expect(element.play).toHaveBeenCalledTimes(1)
        })

        it('Should start over without a mediaKey, as before', async function() {
            await render(<Video src="https://s3/v1" playOverlay={true} />)
            await playTo42()
            await render(<Video src="https://s3/v2" playOverlay={true} />)
            expect(container.querySelector('[role="button"]')).not.toBe(null)
        })
    })
})
