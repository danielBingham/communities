const fs = require('fs')
const os = require('os')
const path = require('path')

const { JSDOM } = require('jsdom')

const Logger = require('../../logger')
const FilesystemStorage = require('../../services/storage/FilesystemStorage')
const PageMetadataService = require('../../services/PageMetadataService')

describe('PageMetadataService', function() {
    let directory = null
    let core = null
    let service = null

    beforeEach(function() {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'communities-page-metadata-'))

        const logger = new Logger()
        logger.level = -1
        core = {
            config: { environment: 'development', host: 'https://localhost:3000' },
            logger: logger
        }
        core.storage = new FilesystemStorage(core, { directory: directory, secret: 'secret' })

        service = new PageMetadataService(core)
    })

    afterEach(function() {
        fs.rmSync(directory, { recursive: true, force: true })
    })

    const writeIndex = (index) => {
        const file = path.join(directory, 'news/index.json')
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify(index))
    }

    const makeNews = function(slug, overrides) {
        return {
            title: `Title of ${slug}`,
            slug: slug,
            date: '09/30/2026',
            author: 'Daniel Bingham',
            content: `Content of **${slug}**.`,
            ...overrides
        }
    }

    // Parse rendered tags the way a crawler would.
    const parseTags = function(html) {
        const { document } = new JSDOM(`<!DOCTYPE html><html><head>${html}</head><body></body></html>`).window
        const content = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null

        return {
            document: document,
            title: document.title,
            description: content('meta[name="description"]'),
            canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
            og: Object.fromEntries(Array.from(document.head.querySelectorAll('meta[property]'))
                .map((meta) => [ meta.getAttribute('property'), meta.getAttribute('content') ])),
            author: content('meta[name="author"]'),
            twitterCard: content('meta[name="twitter:card"]')
        }
    }

    describe('getDefaultMetadata()', function() {
        it('Should use the configured host for the image', function() {
            expect(service.getDefaultMetadata().image.url).toBe('https://localhost:3000/social-sharing-image.jpg')
            expect(service.getDefaultMetadata().url).toBeNull()
        })
    })

    describe('getRootMetadata()', function() {
        it('Should point at the home page', function() {
            expect(service.getRootMetadata().url).toBe('https://localhost:3000/')
        })
    })

    describe('getNewsListMetadata()', function() {
        it('Should point at the News page', function() {
            expect(service.getNewsListMetadata().url).toBe('https://localhost:3000/about/news')
        })
    })

    describe('getNewsMetadata()', function() {
        it('Should build the metadata for a post', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })

            const metadata = await service.getNewsMetadata('a-post')
            expect(metadata.title).toBe('Title of a-post')
            expect(metadata.description).toBe('Content of a-post.')
            expect(metadata.url).toBe('https://localhost:3000/about/news/a-post')
            expect(metadata.type).toBe('article')
            expect(metadata.article).toEqual({ publishedTime: '2026-09-30', author: 'Daniel Bingham' })
        })

        it('Should return null for a post that doesn\'t exist', async function() {
            expect(await service.getNewsMetadata('a-post')).toBeNull()

            writeIndex({ 'a-post': makeNews('a-post') })
            service.news = null
            expect(await service.getNewsMetadata('b-post')).toBeNull()
        })

        it('Should not mistake properties every object has for posts', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })

            for(const slug of [ 'constructor', 'toString', 'hasOwnProperty', '__proto__' ]) {
                expect(await service.getNewsMetadata(slug)).toBeNull()
            }
        })

        it('Should hold on to News rather than fetching it for every request', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })
            const getIndex = jest.spyOn(service.newsService, 'getIndex')

            await service.getNewsMetadata('a-post')
            await service.getNewsMetadata('a-post')
            await service.getNewsMetadata('a-post')

            expect(getIndex).toHaveBeenCalledTimes(1)
        })

        it('Should share one fetch between requests made at the same time', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })
            const getIndex = jest.spyOn(service.newsService, 'getIndex')

            const results = await Promise.all([
                service.getNewsMetadata('a-post'),
                service.getNewsMetadata('a-post'),
                service.getNewsMetadata('a-post')
            ])

            expect(getIndex).toHaveBeenCalledTimes(1)
            expect(results.map((metadata) => metadata.title)).toEqual([ 'Title of a-post', 'Title of a-post', 'Title of a-post' ])
        })

        it('Should fetch News again once what it holds is too old', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })
            await service.getNewsMetadata('a-post')

            writeIndex({ 'a-post': makeNews('a-post', { title: 'A New Title' }) })

            // Still fresh: the old title.
            service.news.fetchedAt = Date.now() - PageMetadataService.NEWS_MAX_AGE + 1000
            expect((await service.getNewsMetadata('a-post')).title).toBe('Title of a-post')

            // Too old: the new one.
            service.news.fetchedAt = Date.now() - PageMetadataService.NEWS_MAX_AGE - 1
            expect((await service.getNewsMetadata('a-post')).title).toBe('A New Title')
        })

        it('Should find a post published after it fetched News', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })
            await service.getNewsMetadata('a-post')

            writeIndex({ 'a-post': makeNews('a-post'), 'new-post': makeNews('new-post') })
            service.news.fetchedAt = Date.now() - PageMetadataService.NEWS_MISS_MAX_AGE - 1

            expect((await service.getNewsMetadata('new-post')).title).toBe('Title of new-post')
        })

        it('Should not fetch News again for a missing post if it just did', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })
            await service.getNewsMetadata('a-post')

            const getIndex = jest.spyOn(service.newsService, 'getIndex')
            for(let count = 0; count < 5; count++) {
                expect(await service.getNewsMetadata(`missing-${count}`)).toBeNull()
            }

            expect(getIndex).not.toHaveBeenCalled()
        })

        it('Should try again after a fetch fails', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })
            const getIndex = jest.spyOn(service.newsService, 'getIndex')
            getIndex.mockRejectedValueOnce(new Error('S3 is down.'))

            await expect(service.getNewsMetadata('a-post')).rejects.toThrow('S3 is down.')
            expect(service.news).toBeNull()

            expect((await service.getNewsMetadata('a-post')).title).toBe('Title of a-post')
            expect(getIndex).toHaveBeenCalledTimes(2)
        })
    })

    describe('renderTags()', function() {
        it('Should render a post\'s metadata as tags crawlers can read', async function() {
            writeIndex({ 'a-post': makeNews('a-post') })

            const tags = parseTags(service.renderTags(await service.getNewsMetadata('a-post')))

            expect(tags.title).toBe('Title of a-post -- Communities')
            expect(tags.description).toBe('Content of a-post.')
            expect(tags.canonical).toBe('https://localhost:3000/about/news/a-post')
            expect(tags.og).toEqual({
                'og:site_name': 'Communities',
                'og:type': 'article',
                'og:title': 'Title of a-post',
                'og:description': 'Content of a-post.',
                'og:url': 'https://localhost:3000/about/news/a-post',
                'og:image': 'https://localhost:3000/social-sharing-image.jpg',
                'og:image:width': '1200',
                'og:image:height': '630',
                'og:image:alt': 'A phone showing a Communities feed.',
                'article:published_time': '2026-09-30'
            })
            expect(tags.author).toBe('Daniel Bingham')
            expect(tags.twitterCard).toBe('summary_large_image')
        })

        it('Should leave out the canonical URL and article tags when there aren\'t any', function() {
            const html = service.renderTags(service.getDefaultMetadata())
            const tags = parseTags(html)

            expect(tags.canonical).toBeNull()
            expect(tags.og['og:url']).toBeUndefined()
            expect(tags.og['article:published_time']).toBeUndefined()
            expect(tags.author).toBeNull()
            expect(tags.og['og:type']).toBe('website')

            // No blank lines left behind by the conditionals.
            expect(html).not.toMatch(/\n\s*\n/)
        })

        it('Should escape what people write so it can\'t break out of the tags', async function() {
            const title = '"><script>alert("title")</script>'
            writeIndex({ 'a-post': makeNews('a-post', {
                title: title,
                author: 'Someone" onload="alert(1)',
                content: 'Text with a <script>alert("content")</script> & an ampersand.'
            }) })

            const html = service.renderTags(await service.getNewsMetadata('a-post'))
            const tags = parseTags(html)

            expect(html).not.toContain('<script')
            expect(tags.document.querySelectorAll('script').length).toBe(0)
            expect(tags.og['og:title']).toBe(title)
            expect(tags.title).toBe(`${title} -- Communities`)
            expect(tags.author).toBe('Someone" onload="alert(1)')
            expect(tags.description).toBe('Text with a alert("content") & an ampersand.')
        })
    })
})
