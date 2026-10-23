const { JSDOM } = require('jsdom')

const Logger = require('../../logger')
const PageMetadataService = require('../../services/PageMetadataService')

describe('PageMetadataService', function() {
    let service = null

    beforeEach(function() {
        const logger = new Logger()
        logger.level = -1
        const core = {
            config: { environment: 'development', host: 'https://localhost:3000' },
            logger: logger
        }

        service = new PageMetadataService(core)
    })

    const makeNews = function(slug, overrides) {
        return {
            title: `Title of ${slug}`,
            slug: slug,
            date: '09/30/2026',
            author: 'Daniel Bingham',
            summary: `Summary of ${slug}.`,
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
        it('Should build the metadata for a post', function() {
            const metadata = service.getNewsMetadata(makeNews('a-post'))
            expect(metadata.title).toBe('Title of a-post')
            expect(metadata.description).toBe('Summary of a-post.')
            expect(metadata.url).toBe('https://localhost:3000/about/news/a-post')
            expect(metadata.type).toBe('article')
            expect(metadata.article).toEqual({ publishedTime: '2026-09-30', author: 'Daniel Bingham' })
        })
    })

    describe('renderTags()', function() {
        it('Should render a post\'s metadata as tags crawlers can read', function() {
            const tags = parseTags(service.renderTags(service.getNewsMetadata(makeNews('a-post'))))

            expect(tags.title).toBe('Title of a-post -- Communities')
            expect(tags.description).toBe('Summary of a-post.')
            expect(tags.canonical).toBe('https://localhost:3000/about/news/a-post')
            expect(tags.og).toEqual({
                'og:site_name': 'Communities',
                'og:type': 'article',
                'og:title': 'Title of a-post',
                'og:description': 'Summary of a-post.',
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

        it('Should escape what people write so it can\'t break out of the tags', function() {
            const title = '"><script>alert("title")</script>'
            const html = service.renderTags(service.getNewsMetadata(makeNews('a-post', {
                title: title,
                author: 'Someone" onload="alert(1)',
                summary: 'A summary with a <script>alert("summary")</script> & an ampersand.'
            })))
            const tags = parseTags(html)

            expect(html).not.toContain('<script')
            expect(tags.document.querySelectorAll('script').length).toBe(0)
            expect(tags.og['og:title']).toBe(title)
            expect(tags.title).toBe(`${title} -- Communities`)
            expect(tags.author).toBe('Someone" onload="alert(1)')
            expect(tags.description).toBe('A summary with a <script>alert("summary")</script> & an ampersand.')
        })
    })
})
