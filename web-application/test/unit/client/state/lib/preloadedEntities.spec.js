/**
 * @jest-environment jsdom
 */
/******************************************************************************
 * Preloaded entities: the entities the server sends with a page, which the
 * client loads into its store when it starts, the way it loads relations.
 ******************************************************************************/

jest.mock('/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn(), verbose: jest.fn() }
}))

import { configureStore } from '@reduxjs/toolkit'

import logger from '/logger'

import NewsReducer from '/state/News'
import { setRelationsInState } from '/state/lib/relations'
import { getPreloadedEntities } from '/state/lib/preloadedEntities'

describe('Preloaded entities', function() {

    const news = {
        title: 'A Post',
        slug: 'a-post',
        date: '09/29/2026',
        author: 'Daniel Bingham',
        summary: 'A summary.',
        content: 'Some </script> <!-- tricky --> content.'
    }

    // A page with `json` in its preloaded entities' <script>, as
    // PageController renders it, or no <script> when it's null.
    const loadPage = function(json) {
        document.head.innerHTML = json === null ? ''
            : `<script type="application/json" id="communities-preloaded-entities">${json}</script>`
    }

    const render = (entities) => JSON.stringify(entities).replace(/</g, '\\u003c')

    afterEach(function() {
        document.head.innerHTML = ''
        jest.clearAllMocks()
    })

    describe('getPreloadedEntities()', function() {
        it('Should read the entities the page came with', function() {
            loadPage(render({ news: { [news.slug]: news } }))
            expect(getPreloadedEntities()).toEqual({ news: { [news.slug]: news } })
        })

        it('Should keep what the server escaped intact', function() {
            const json = render({ news: { [news.slug]: news } })
            expect(json).not.toContain('</script>')

            loadPage(json)
            expect(getPreloadedEntities().news[news.slug].content).toBe('Some </script> <!-- tricky --> content.')
        })

        it('Should return null when the page came without entities', function() {
            loadPage(null)
            expect(getPreloadedEntities()).toBeNull()

            loadPage('{}')
            expect(getPreloadedEntities()).toBeNull()
        })

        it('Should ignore a <script> it can\'t read', function() {
            loadPage('{ not json')
            expect(getPreloadedEntities()).toBeNull()
            expect(logger.warn).toHaveBeenCalled()
        })

        it('Should leave out anything that isn\'t a dictionary of entities', function() {
            for(const json of [ '[]', 'null', '"news"', '5' ]) {
                loadPage(json)
                expect(getPreloadedEntities()).toBeNull()
            }

            loadPage(render({
                news: { 'a-post': news, 'not-an-entity': 'a string', 'also-not': null, 'nor-this': [ 1 ] },
                users: [],
                posts: null,
                groups: {}
            }))
            expect(getPreloadedEntities()).toEqual({ news: { 'a-post': news } })
        })
    })

    describe('Loading them into the store', function() {
        const createStore = () => configureStore({ reducer: { News: NewsReducer } })

        it('Should put a preloaded News post in the dictionary, where useNews() looks before requesting it', function() {
            loadPage(render({ news: { [news.slug]: news } }))
            const store = createStore()

            store.dispatch(setRelationsInState(getPreloadedEntities()))

            expect(store.getState().News.dictionary).toEqual({ [news.slug]: news })
            expect(store.getState().News.queries).toEqual({})
        })

        it('Should leave the store alone when the page came without entities', function() {
            loadPage(null)
            const store = createStore()
            const before = store.getState()

            store.dispatch(setRelationsInState(getPreloadedEntities()))

            expect(store.getState()).toBe(before)
        })

        it('Should warn about, and skip, an entity type it doesn\'t know', function() {
            loadPage(render({ widgets: { 'a-widget': { id: 'a-widget' } }, news: { [news.slug]: news } }))
            const store = createStore()

            store.dispatch(setRelationsInState(getPreloadedEntities()))

            expect(logger.warn).toHaveBeenCalledWith(`Entity 'widgets' is missing from the 'entityMap'.`)
            expect(store.getState().News.dictionary).toEqual({ [news.slug]: news })
        })
    })
})
