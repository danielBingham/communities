/**
 * @jest-environment jsdom
 */
/******************************************************************************
 * Signed links to files, and when to replace them: the File slice's
 * `sources` and `sourceRefreshTimes`, and the thunks that fill them from the
 * API's `sources` and `sourceLifetimes`.
 ******************************************************************************/

jest.mock('/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn(), verbose: jest.fn() }
}))

// Requests answer with whatever the test gives respond().
const mockRequests = []
jest.mock('/state/lib/makeRequest', () => ({
    makeRequest: (method, endpoint, body, onSuccess, onFailure) => function() {
        mockRequests.push({ method, endpoint, onSuccess, onFailure })
        return [ Promise.resolve({ success: true }), new AbortController() ]
    }
}))

import { configureStore } from '@reduxjs/toolkit'

import FileReducer, { getFile, getFileSource, patchFile } from '/state/File'
import { setSource, setSources, setFileNull, removeSource } from '/state/File/slice'
import { REFRESH_AHEAD_MS, refreshTimeFor, refreshTimesFor, isDueForRefresh } from '/state/File/sourceRefresh'

describe('File sources', function() {

    const store = () => configureStore({ reducer: { File: FileReducer } })

    beforeEach(function() {
        mockRequests.length = 0
    })

    describe('refreshTimeFor()', function() {
        it('Should replace a link 5 minutes before it runs out', function() {
            expect(refreshTimeFor(3600, 1000)).toBe(1000 + 3600*1000 - REFRESH_AHEAD_MS)
            expect(refreshTimeFor(60*60*24*7, 0)).toBe(60*60*24*7*1000 - REFRESH_AHEAD_MS)
        })

        it('Should replace a short link with a quarter of its life left', function() {
            expect(refreshTimeFor(60, 1000)).toBe(1000 + 45*1000)
            expect(refreshTimeFor(1, 0)).toBe(750)
        })

        it('Should give no time without a positive lifetime', function() {
            for (const lifetime of [ undefined, null, 0, -1, '3600', NaN, Infinity ]) {
                expect(refreshTimeFor(lifetime, 1000)).toBe(undefined)
            }
        })
    })

    describe('refreshTimesFor()', function() {
        it('Should time each link that has a lifetime', function() {
            expect(refreshTimesFor({ full: 'https://a', 650: 'https://b', 200: null }, { full: 3600, 200: 3600 }, 0))
                .toEqual({ full: 3600*1000 - REFRESH_AHEAD_MS })
            expect(refreshTimesFor({ full: 'https://a' }, undefined, 0)).toEqual({})
            expect(refreshTimesFor(undefined, undefined, 0)).toEqual({})
        })
    })

    describe('isDueForRefresh()', function() {
        it('Should be due at its refresh time, and never without one', function() {
            expect(isDueForRefresh(1000, 999)).toBe(false)
            expect(isDueForRefresh(1000, 1000)).toBe(true)
            expect(isDueForRefresh(undefined, 1e15)).toBe(false)
        })
    })

    describe('The slice', function() {
        it('Should keep each link\'s refresh time beside it', function() {
            const s = store()
            s.dispatch(setSources({ fileId: 'f', sources: { full: 'https://a', 650: 'https://b' }, refreshTimes: { full: 10, 650: 20 } }))
            expect(s.getState().File.sources).toEqual({ f: { full: 'https://a', 650: 'https://b' } })
            expect(s.getState().File.sourceRefreshTimes).toEqual({ f: { full: 10, 650: 20 } })

            // A link without a time (an older server) forgets the old one.
            s.dispatch(setSources({ fileId: 'f', sources: { 650: 'https://c' } }))
            expect(s.getState().File.sourceRefreshTimes).toEqual({ f: { full: 10 } })

            s.dispatch(setSource({ fileId: 'f', variant: 650, url: 'https://d', refreshTime: 30 }))
            expect(s.getState().File.sourceRefreshTimes.f[650]).toBe(30)

            // A variant that couldn't be found has no link to replace.
            s.dispatch(setSource({ fileId: 'f', variant: 650, url: null, refreshTime: 40 }))
            expect(s.getState().File.sources.f[650]).toBe(null)
            expect(650 in s.getState().File.sourceRefreshTimes.f).toBe(false)

            s.dispatch(setSource({ fileId: 'f', url: 'https://e', refreshTime: 50 }))
            expect(s.getState().File.sources.f.full).toBe('https://e')
            expect(s.getState().File.sourceRefreshTimes.f.full).toBe(50)
        })

        it('Should forget the times with the links', function() {
            const s = store()
            s.dispatch(setSources({ fileId: 'f', sources: { full: 'https://a' }, refreshTimes: { full: 10 } }))
            s.dispatch(removeSource({ fileId: 'f' }))
            expect(s.getState().File.sourceRefreshTimes).toEqual({})

            s.dispatch(setSources({ fileId: 'g', sources: { full: 'https://a' }, refreshTimes: { full: 10 } }))
            s.dispatch(setFileNull('g'))
            expect(s.getState().File.sources.g).toBe(null)
            expect(s.getState().File.sourceRefreshTimes).toEqual({})
        })
    })

    describe('The thunks', function() {
        const file = { id: 'f', type: 'image/jpeg', kind: 'image', variants: [ '650' ] }

        it('Should time the links from GET /file/:id/source, from when the response arrived', function() {
            const s = store()
            s.dispatch(getFileSource('f', '650'))
            expect(mockRequests[0]).toMatchObject({ method: 'GET', endpoint: '/file/f/source?variant=650' })

            const before = Date.now()
            mockRequests[0].onSuccess({ entity: file, sources: { 650: 'https://b' }, sourceLifetimes: { 650: 3600 }, relations: {} })
            const after = Date.now()

            const time = s.getState().File.sourceRefreshTimes.f[650]
            expect(time).toBeGreaterThanOrEqual(refreshTimeFor(3600, before))
            expect(time).toBeLessThanOrEqual(refreshTimeFor(3600, after))
        })

        it('Should time the links from GET /file/:id and PATCH /file/:id', function() {
            const s = store()
            s.dispatch(getFile('f', '650'))
            mockRequests[0].onSuccess({
                entity: file, sources: { full: 'https://a', 650: 'https://b' }, sourceLifetimes: { full: 7200, 650: 7200 }, relations: {}
            })
            expect(Object.keys(s.getState().File.sourceRefreshTimes.f).sort()).toEqual([ '650', 'full' ])

            s.dispatch(patchFile('f', { crop: {} }))
            mockRequests[1].onSuccess({ entity: file, sources: { full: 'https://c' }, sourceLifetimes: { full: 60 }, relations: {} })
            expect(s.getState().File.sources.f.full).toBe('https://c')
            expect(s.getState().File.sourceRefreshTimes.f.full - Date.now()).toBeLessThanOrEqual(45*1000)
        })

        it('Should still take a response without lifetimes, keeping its links', function() {
            const s = store()
            s.dispatch(getFileSource('f', 'full'))
            mockRequests[0].onSuccess({ entity: file, sources: { full: 'https://a' }, relations: {} })
            expect(s.getState().File.sources.f.full).toBe('https://a')
            expect(s.getState().File.sourceRefreshTimes).toEqual({})
        })
    })
})
