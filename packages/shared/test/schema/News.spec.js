const { schema, lib } = require('../../')

const NewsSchema = schema.NewsSchema

describe('NewsSchema', function() {

    const valid = function(overrides) {
        return {
            title: "Protocols Aren't the Answer",
            slug: '09-29-2026-protocols-arent-the-answer',
            date: '09/29/2026',
            author: 'Daniel Bingham',
            summary: 'Protocols are good tools, but they are not the answer.',
            content: '# Protocols\n\nThey are not the answer.',
            ...overrides
        }
    }

    const types = (errors) => errors.all.map((error) => error.type)

    describe('clean()', function() {
        it('Should keep only News properties', function() {
            const cleaned = new NewsSchema().clean(valid({ id: 5, extra: 'nope', __proto__pollution: true }))
            expect(Object.keys(cleaned).sort()).toEqual([ 'author', 'content', 'date', 'slug', 'summary', 'title' ])
        })

        it('Should trim the short fields but leave the Markdown content alone', function() {
            const cleaned = new NewsSchema().clean(valid({ title: '  A Title  ', slug: ' a-slug ', date: ' 09/29/2026 ', author: ' Someone ', summary: ' A summary. \n', content: '    indented code\n\n' }))
            expect(cleaned.title).toBe('A Title')
            expect(cleaned.slug).toBe('a-slug')
            expect(cleaned.date).toBe('09/29/2026')
            expect(cleaned.author).toBe('Someone')
            expect(cleaned.summary).toBe('A summary.')
            expect(cleaned.content).toBe('    indented code\n\n')
        })
    })

    describe('validate() on create', function() {
        it('Should accept a complete post', function() {
            expect(new NewsSchema().validate(valid()).all).toEqual([])
        })

        it('Should require every property', function() {
            for(const property of [ 'title', 'slug', 'date', 'author', 'summary', 'content' ]) {
                const news = valid()
                delete news[property]
                expect(types(new NewsSchema().validate(news))).toEqual([ `${property}:required` ])
            }
        })

        it('Should reject empty and blank values', function() {
            for(const property of [ 'title', 'slug', 'date', 'author', 'summary', 'content' ]) {
                expect(types(new NewsSchema().validate(valid({ [property]: '' })))).toContain(`${property}:required`)
            }
            expect(types(new NewsSchema().validate(valid({ content: ' \n\t ' })))).toEqual([ 'content:required' ])
            expect(types(new NewsSchema().validate(valid({ summary: ' \n\t ' })))).toEqual([ 'summary:required' ])
        })

        it('Should reject null and non-string values', function() {
            for(const property of [ 'title', 'slug', 'date', 'author', 'summary', 'content' ]) {
                expect(types(new NewsSchema().validate(valid({ [property]: null })))).toEqual([ `${property}:null` ])
                expect(types(new NewsSchema().validate(valid({ [property]: 5 })))).toEqual([ `${property}:invalid-type` ])
            }
        })

        it('Should only accept real dates written MM/DD/YYYY', function() {
            expect(types(new NewsSchema().validate(valid({ date: '2026-09-29' })))).toEqual([ 'date:invalid' ])
            expect(types(new NewsSchema().validate(valid({ date: '02/30/2026' })))).toEqual([ 'date:invalid' ])
        })

        it('Should only accept lowercase, hyphen separated slugs', function() {
            for(const slug of [ '9-30-2026-social-solutions-for-enshittification', '09-24-2025-release-0-6-0', 'about' ]) {
                expect(new NewsSchema().validate(valid({ slug: slug })).all).toEqual([])
            }

            for(const slug of [ 'Upper-Case', 'has space', 'double--hyphen', '-leading', 'trailing-', 'under_score', '../index', 'news/index.json', '__proto__' ]) {
                expect(types(new NewsSchema().validate(valid({ slug: slug })))).toEqual([ 'slug:invalid' ])
            }
        })

        it('Should limit the length of each property', function() {
            // The summary is a link preview's description.
            expect(NewsSchema.MAX_SUMMARY_LENGTH).toBe(lib.pageMetadata.DESCRIPTION_LENGTH)

            expect(types(new NewsSchema().validate(valid({ title: 'a'.repeat(512) })))).toEqual([ 'title:too-long' ])
            expect(types(new NewsSchema().validate(valid({ slug: 'a'.repeat(512) })))).toEqual([ 'slug:too-long' ])
            expect(types(new NewsSchema().validate(valid({ author: 'a'.repeat(256) })))).toEqual([ 'author:too-long' ])

            expect(new NewsSchema().validate(valid({ summary: 'a'.repeat(NewsSchema.MAX_SUMMARY_LENGTH) })).all).toEqual([])
            expect(types(new NewsSchema().validate(valid({ summary: 'a'.repeat(NewsSchema.MAX_SUMMARY_LENGTH + 1) })))).toEqual([ 'summary:too-long' ])

            expect(new NewsSchema().validate(valid({ content: 'a'.repeat(NewsSchema.MAX_CONTENT_LENGTH) })).all).toEqual([])
            expect(types(new NewsSchema().validate(valid({ content: 'a'.repeat(NewsSchema.MAX_CONTENT_LENGTH + 1) })))).toEqual([ 'content:too-long' ])
        })
    })

    describe('validate() on update', function() {
        it('Should accept a partial post', function() {
            const existing = valid()
            expect(new NewsSchema().validate({ title: 'A New Title' }, existing).all).toEqual([])
            expect(new NewsSchema().validate({ content: 'New content.' }, existing).all).toEqual([])
            expect(new NewsSchema().validate({}, existing).all).toEqual([])
        })

        it('Should still validate the properties that are present', function() {
            const existing = valid()
            expect(types(new NewsSchema().validate({ date: '13/01/2026' }, existing))).toEqual([ 'date:invalid' ])
            expect(types(new NewsSchema().validate({ title: '' }, existing))).toEqual([ 'title:required' ])
            expect(types(new NewsSchema().validate({ author: null }, existing))).toEqual([ 'author:null' ])
            expect(types(new NewsSchema().validate({ summary: '' }, existing))).toEqual([ 'summary:required' ])
            expect(types(new NewsSchema().validate({ summary: null }, existing))).toEqual([ 'summary:null' ])
        })

        it('Should not allow the slug to change', function() {
            const existing = valid()
            expect(new NewsSchema().validate({ slug: existing.slug }, existing).all).toEqual([])
            expect(types(new NewsSchema().validate({ slug: 'a-different-slug' }, existing))).toEqual([ 'slug:not-allowed' ])
        })
    })
})
