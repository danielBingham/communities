const fs = require('fs')
const os = require('os')
const path = require('path')

const Logger = require('../../logger')
const FilesystemStorage = require('../../services/storage/FilesystemStorage')
const NewsService = require('../../services/NewsService')

describe('NewsService', function() {
    let directory = null
    let core = null
    let service = null

    beforeEach(function() {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'communities-news-'))

        const logger = new Logger()
        logger.level = -1
        core = {
            config: { environment: 'development', host: 'https://localhost:3000' },
            logger: logger
        }
        core.storage = new FilesystemStorage(core, { directory: directory, secret: 'secret' })

        service = new NewsService(core)
    })

    afterEach(function() {
        fs.rmSync(directory, { recursive: true, force: true })
    })

    const indexFile = () => path.join(directory, 'news/index.json')
    const readIndex = () => JSON.parse(fs.readFileSync(indexFile(), 'utf8'))
    const writeIndex = (index) => {
        fs.mkdirSync(path.dirname(indexFile()), { recursive: true })
        fs.writeFileSync(indexFile(), typeof index === 'string' ? index : JSON.stringify(index))
    }

    const makeNews = function(slug, date, overrides) {
        return {
            title: `Title of ${slug}`,
            slug: slug,
            date: date ?? '09/30/2026',
            author: 'Daniel Bingham',
            summary: `Summary of ${slug}.`,
            content: `Content of **${slug}**.`,
            ...overrides
        }
    }

    describe('getIndex()', function() {
        it('Should be empty before anything has been posted', async function() {
            expect(await service.getIndex()).toEqual({})
        })

        it('Should refuse an index that isn\'t a JSON object', async function() {
            for(const contents of [ '{ not json', '[]', 'null', '"a string"' ]) {
                writeIndex(contents)
                await expect(service.getIndex()).rejects.toMatchObject({ type: 'invalid-index' })
            }
        })
    })

    describe('createNews()', function() {
        it('Should keep the post in news/index.json, keyed by its slug', async function() {
            const news = makeNews('09-30-2026-a-post')
            const created = await service.createNews(news)

            expect(created).toEqual(news)
            expect(readIndex()).toEqual({ '09-30-2026-a-post': news })

            // Pretty printed, so it can be read and edited by hand.
            expect(fs.readFileSync(indexFile(), 'utf8')).toBe(JSON.stringify({ '09-30-2026-a-post': news }, null, 4) + '\n')
        })

        it('Should only keep the properties of a post, in a consistent order', async function() {
            const news = makeNews('a-post')
            await service.createNews({ content: news.content, id: 7, summary: news.summary, author: news.author, date: news.date, slug: news.slug, title: news.title, extra: true })

            expect(Object.keys(readIndex()['a-post'])).toEqual([ 'title', 'slug', 'date', 'author', 'summary', 'content' ])
        })

        it('Should refuse a slug that\'s already taken, leaving the existing post alone', async function() {
            await service.createNews(makeNews('a-post'))

            await expect(service.createNews(makeNews('a-post', '01/01/2026', { title: 'Another' })))
                .rejects.toMatchObject({ type: 'conflict' })
            expect(readIndex()['a-post'].title).toBe('Title of a-post')
        })
    })

    describe('getNews()', function() {
        it('Should get a post by its slug', async function() {
            const news = makeNews('a-post')
            await service.createNews(news)

            expect(await service.getNews('a-post')).toEqual(news)
        })

        it('Should return null for a post that doesn\'t exist', async function() {
            expect(await service.getNews('a-post')).toBeNull()

            await service.createNews(makeNews('a-post'))
            expect(await service.getNews('b-post')).toBeNull()
        })

        it('Should not mistake properties every object has for posts', async function() {
            await service.createNews(makeNews('a-post'))

            for(const slug of [ 'constructor', 'toString', 'hasOwnProperty', '__proto__' ]) {
                expect(await service.getNews(slug)).toBeNull()
            }
        })

        it('Should use the index\'s key as the slug', async function() {
            writeIndex({ 'the-key': makeNews('a-different-slug') })

            expect((await service.getNews('the-key')).slug).toBe('the-key')
        })

        it('Should give a post written before posts had summaries a null summary', async function() {
            const { summary, ...withoutSummary } = makeNews('an-old-post')
            writeIndex({ 'an-old-post': withoutSummary })

            expect(await service.getNews('an-old-post')).toEqual({ ...withoutSummary, summary: null })
        })
    })

    describe('getNewsPage()', function() {
        // Twelve posts, added out of date order.
        const dates = [
            '03/06/2026', '09/30/2026', '12/15/2025', '01/28/2026', '11/21/2025', '09/29/2026',
            '10/06/2025', '01/27/2026', '11/03/2025', '09/24/2025', '10/16/2025', '11/21/2025'
        ]

        beforeEach(async function() {
            const index = {}
            dates.forEach((date, position) => {
                const slug = `${date.replaceAll('/', '-')}-post-${position}`
                index[slug] = makeNews(slug, date)
            })
            writeIndex(index)
        })

        it('Should return the first page of 5 posts, newest first', async function() {
            const page = await service.getNewsPage(1)

            expect(page.list).toEqual([
                '09-30-2026-post-1',
                '09-29-2026-post-5',
                '03-06-2026-post-0',
                '01-28-2026-post-3',
                '01-27-2026-post-7'
            ])
            expect(Object.keys(page.dictionary).sort()).toEqual([ ...page.list ].sort())
            expect(page.dictionary['09-30-2026-post-1']).toEqual(makeNews('09-30-2026-post-1', '09/30/2026'))
            expect(page.meta).toEqual({ count: 12, page: 1, pageSize: 5, numberOfPages: 3 })
        })

        it('Should return later pages', async function() {
            const second = await service.getNewsPage(2)
            expect(second.list).toEqual([
                '12-15-2025-post-2',
                // Two posts on 11/21/2025: the one added last comes first.
                '11-21-2025-post-11',
                '11-21-2025-post-4',
                '11-03-2025-post-8',
                '10-16-2025-post-10'
            ])
            expect(second.meta).toEqual({ count: 12, page: 2, pageSize: 5, numberOfPages: 3 })

            const third = await service.getNewsPage(3)
            expect(third.list).toEqual([ '10-06-2025-post-6', '09-24-2025-post-9' ])
            expect(third.meta).toEqual({ count: 12, page: 3, pageSize: 5, numberOfPages: 3 })
        })

        it('Should return an empty page past the last one', async function() {
            const page = await service.getNewsPage(4)
            expect(page.list).toEqual([])
            expect(page.dictionary).toEqual({})
            expect(page.meta).toEqual({ count: 12, page: 4, pageSize: 5, numberOfPages: 3 })
        })

        it('Should return an empty first page when nothing has been posted', async function() {
            fs.rmSync(indexFile())

            const page = await service.getNewsPage(1)
            expect(page).toEqual({ dictionary: {}, list: [], meta: { count: 0, page: 1, pageSize: 5, numberOfPages: 0 } })
        })
    })

    describe('updateNews()', function() {
        it('Should change only the properties it\'s given', async function() {
            const news = makeNews('a-post')
            await service.createNews(news)

            const updated = await service.updateNews('a-post', { title: 'A New Title', content: 'New content.' })

            const expected = { ...news, title: 'A New Title', content: 'New content.' }
            expect(updated).toEqual(expected)
            expect(readIndex()).toEqual({ 'a-post': expected })
        })

        it('Should keep the post\'s place in the index', async function() {
            for(const slug of [ 'a-post', 'b-post', 'c-post' ]) {
                await service.createNews(makeNews(slug))
            }

            await service.updateNews('a-post', { title: 'Updated' })
            expect(Object.keys(readIndex())).toEqual([ 'a-post', 'b-post', 'c-post' ])
        })

        it('Should not change the slug', async function() {
            await service.createNews(makeNews('a-post'))

            const updated = await service.updateNews('a-post', { slug: 'b-post' })
            expect(updated.slug).toBe('a-post')
            expect(Object.keys(readIndex())).toEqual([ 'a-post' ])
        })

        it('Should refuse a post that doesn\'t exist', async function() {
            await service.createNews(makeNews('a-post'))

            await expect(service.updateNews('b-post', { title: 'Nope' })).rejects.toMatchObject({ type: 'not-found' })
            await expect(service.updateNews('constructor', { title: 'Nope' })).rejects.toMatchObject({ type: 'not-found' })
            expect(Object.keys(readIndex())).toEqual([ 'a-post' ])
        })
    })

    describe('deleteNews()', function() {
        it('Should remove the post and return it', async function() {
            const news = makeNews('a-post')
            await service.createNews(news)
            await service.createNews(makeNews('b-post'))

            expect(await service.deleteNews('a-post')).toEqual(news)
            expect(Object.keys(readIndex())).toEqual([ 'b-post' ])
            expect(await service.getNews('a-post')).toBeNull()
        })

        it('Should refuse a post that doesn\'t exist', async function() {
            await expect(service.deleteNews('a-post')).rejects.toMatchObject({ type: 'not-found' })
            await expect(service.deleteNews('toString')).rejects.toMatchObject({ type: 'not-found' })
        })
    })

    describe('An index edited by hand', function() {
        it('Should skip entries that aren\'t posts when reading, but keep them when writing', async function() {
            writeIndex({
                'broken': null,
                'also-broken': [ 'not', 'a', 'post' ],
                'a-post': makeNews('a-post')
            })

            const page = await service.getNewsPage(1)
            expect(page.list).toEqual([ 'a-post' ])
            expect(page.meta.count).toBe(1)
            expect(await service.getNews('broken')).toBeNull()

            await service.createNews(makeNews('b-post'))
            expect(Object.keys(readIndex())).toEqual([ 'broken', 'also-broken', 'a-post', 'b-post' ])
        })
    })
})
