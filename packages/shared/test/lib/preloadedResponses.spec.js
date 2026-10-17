const { lib } = require('../../')

const { ELEMENT_ID, getPreloadedResponseKey } = lib.preloadedResponses

describe('lib.preloadedResponses', function() {

    it('Should name the element the responses are kept in', function() {
        expect(ELEMENT_ID).toBe('communities-preloaded-responses')
    })

    describe('getPreloadedResponseKey()', function() {
        it('Should join the method and endpoint', function() {
            expect(getPreloadedResponseKey('GET', '/news/09-29-2026-a-post')).toBe('GET /news/09-29-2026-a-post')
            expect(getPreloadedResponseKey('get', '/news?page=2')).toBe('GET /news?page=2')
        })

        it('Should give the same key however the query is ordered', function() {
            expect(getPreloadedResponseKey('GET', '/users?page=2&name=dan'))
                .toBe(getPreloadedResponseKey('GET', '/users?name=dan&page=2'))
        })

        it('Should keep encoded characters encoded', function() {
            const slug = 'a slug/with?odd#characters'
            expect(getPreloadedResponseKey('GET', `/news/${encodeURIComponent(slug)}`))
                .toBe('GET /news/a%20slug%2Fwith%3Fodd%23characters')
        })

        it('Should treat a missing leading slash and an empty query the same', function() {
            expect(getPreloadedResponseKey('GET', 'news')).toBe('GET /news')
            expect(getPreloadedResponseKey('GET', '/news?')).toBe('GET /news')
        })

        it('Should tell different methods apart', function() {
            expect(getPreloadedResponseKey('GET', '/news')).not.toBe(getPreloadedResponseKey('POST', '/news'))
        })
    })
})
