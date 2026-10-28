const { lib } = require('../../')

const { slugify, generateNewsSlug, getNewsDateSortKey, sortNewsByDateDescending } = lib.news

describe('lib.news', function() {

    describe('slugify()', function() {
        it('Should lowercase and hyphenate words', function() {
            expect(slugify('Social Solutions for Enshittification')).toBe('social-solutions-for-enshittification')
        })

        it('Should drop apostrophes rather than splitting on them', function() {
            expect(slugify("Protocols Aren't the Answer")).toBe('protocols-arent-the-answer')
            expect(slugify('Protocols Aren’t the Answer')).toBe('protocols-arent-the-answer')
        })

        it('Should turn punctuation and runs of whitespace into single hyphens', function() {
            expect(slugify('Release 0.11.0')).toBe('release-0-11-0')
            expect(slugify('  Winter   2026: Transparency -- Update!  ')).toBe('winter-2026-transparency-update')
        })

        it('Should drop accents from letters', function() {
            expect(slugify('Café Coopératif')).toBe('cafe-cooperatif')
        })

        it('Should return an empty string when there is nothing to keep', function() {
            for(const value of [ '', '   ', '!!!', undefined, null, 5 ]) {
                expect(slugify(value)).toBe('')
            }
        })
    })

    describe('generateNewsSlug()', function() {
        it('Should join the date and title with hyphens', function() {
            expect(generateNewsSlug('09/29/2026', "Protocols Aren't the Answer")).toBe('09-29-2026-protocols-arent-the-answer')
            expect(generateNewsSlug('03/06/2026', 'Release 0.11.0')).toBe('03-06-2026-release-0-11-0')
        })

        it('Should generate a partial slug while the form is being filled in', function() {
            expect(generateNewsSlug('', 'Release 0.11.0')).toBe('release-0-11-0')
            expect(generateNewsSlug('09/2', '')).toBe('09-2')
            expect(generateNewsSlug('', '')).toBe('')
        })

        it('Should generate slugs the News schema accepts', function() {
            const { NewsSchema } = require('../../schema')
            const schema = new NewsSchema()

            const slug = generateNewsSlug('10/15/2026', 'A Better News Page: Now With Markdown!')
            expect(slug).toBe('10-15-2026-a-better-news-page-now-with-markdown')
            expect(schema.properties.slug.validate(slug, undefined, 'create')).toEqual([])
        })
    })

    describe('getNewsDateSortKey()', function() {
        it('Should sort chronologically across months and years', function() {
            expect(getNewsDateSortKey('09/30/2026')).toBe(20260930)
            expect(getNewsDateSortKey('12/15/2025')).toBeLessThan(getNewsDateSortKey('01/27/2026'))
            expect(getNewsDateSortKey('09/29/2026')).toBeLessThan(getNewsDateSortKey('09/30/2026'))
        })

        it('Should put invalid dates last', function() {
            expect(getNewsDateSortKey('2026-09-30')).toBe(-Infinity)
            expect(getNewsDateSortKey(undefined)).toBe(-Infinity)
        })
    })

    describe('sortNewsByDateDescending()', function() {
        it('Should sort newest first, without changing the original', function() {
            const news = [
                { slug: 'a', date: '12/15/2025' },
                { slug: 'b', date: '09/30/2026' },
                { slug: 'c', date: '01/27/2026' },
                { slug: 'd', date: 'not a date' },
                { slug: 'e', date: '09/24/2025' }
            ]

            expect(sortNewsByDateDescending(news).map((n) => n.slug)).toEqual([ 'b', 'c', 'a', 'e', 'd' ])
            expect(news.map((n) => n.slug)).toEqual([ 'a', 'b', 'c', 'd', 'e' ])
        })

        it('Should keep posts on the same date in the order they were given', function() {
            const news = [
                { slug: 'first', date: '11/21/2025' },
                { slug: 'older', date: '11/03/2025' },
                { slug: 'second', date: '11/21/2025' }
            ]

            expect(sortNewsByDateDescending(news).map((n) => n.slug)).toEqual([ 'first', 'second', 'older' ])
        })
    })
})
