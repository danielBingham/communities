const { lib } = require('../../')

const {
    DEFAULT_TITLE,
    DEFAULT_DESCRIPTION,
    toAbsoluteURL,
    getDocumentTitle,
    buildDefaultMetadata,
    buildRootMetadata,
    buildNewsListMetadata,
    buildNewsMetadata
} = lib.pageMetadata

const host = 'https://staging.communities.social'

describe('lib.pageMetadata', function() {

    describe('toAbsoluteURL()', function() {
        it('Should resolve a path against the host', function() {
            expect(toAbsoluteURL(host, '/about/news')).toBe('https://staging.communities.social/about/news')
            expect(toAbsoluteURL('https://localhost:3000', '/')).toBe('https://localhost:3000/')
        })
    })

    describe('getDocumentTitle()', function() {
        it('Should add the site\'s name', function() {
            expect(getDocumentTitle('News')).toBe('News -- Communities')
        })
    })

    describe('buildDefaultMetadata()', function() {
        it('Should describe the site, with an absolute image URL and no canonical URL', function() {
            expect(buildDefaultMetadata(host)).toEqual({
                siteName: 'Communities',
                title: DEFAULT_TITLE,
                documentTitle: DEFAULT_TITLE,
                description: DEFAULT_DESCRIPTION,
                url: null,
                type: 'website',
                image: {
                    url: 'https://staging.communities.social/social-sharing-image.png',
                    width: 1200,
                    height: 630,
                    alt: 'A phone showing a Communities feed.'
                },
                article: null
            })
        })
    })

    describe('buildRootMetadata()', function() {
        it('Should be the defaults, at the home page', function() {
            expect(buildRootMetadata(host)).toEqual({ ...buildDefaultMetadata(host), url: 'https://staging.communities.social/' })
        })
    })

    describe('buildNewsListMetadata()', function() {
        it('Should describe the News page', function() {
            const metadata = buildNewsListMetadata(host)
            expect(metadata.title).toBe('News')
            expect(metadata.documentTitle).toBe('News -- Communities')
            expect(metadata.url).toBe('https://staging.communities.social/about/news')
            expect(metadata.type).toBe('website')
            expect(metadata.image).toEqual(buildDefaultMetadata(host).image)
        })
    })

    describe('buildNewsMetadata()', function() {
        const news = {
            title: 'Protocols Aren\'t the Answer',
            slug: '09-29-2026-protocols-arent-the-answer',
            date: '09/29/2026',
            author: 'Daniel Bingham',
            summary: 'Protocols are good tools, but a protocol can\'t decide who a platform answers to.',
            content: '# Protocols\n\nThere\'s been a lot of talk about **protocols** lately.'
        }

        it('Should describe the post as an article', function() {
            expect(buildNewsMetadata(host, news)).toEqual({
                ...buildDefaultMetadata(host),
                title: 'Protocols Aren\'t the Answer',
                documentTitle: 'Protocols Aren\'t the Answer -- Communities',
                description: 'Protocols are good tools, but a protocol can\'t decide who a platform answers to.',
                url: 'https://staging.communities.social/about/news/09-29-2026-protocols-arent-the-answer',
                type: 'article',
                article: {
                    publishedTime: '2026-09-29',
                    author: 'Daniel Bingham'
                }
            })
        })

        it('Should use the summary as it is, never the content', function() {
            const metadata = buildNewsMetadata(host, { ...news, summary: 'Just the summary.', content: 'Not the content.' })
            expect(metadata.description).toBe('Just the summary.')
        })

        it('Should put a summary written on several lines on one', function() {
            const metadata = buildNewsMetadata(host, { ...news, summary: '  A summary\nwritten on\r\n\n  several lines.  ' })
            expect(metadata.description).toBe('A summary written on several lines.')
        })

        it('Should fall back to the News description for a post without a summary', function() {
            for(const summary of [ undefined, null, '', '   \n ', 12 ]) {
                const metadata = buildNewsMetadata(host, { ...news, summary: summary })
                expect(metadata.description).toBe(buildNewsListMetadata(host).description)
            }
        })

        it('Should encode the slug in the URL', function() {
            const metadata = buildNewsMetadata(host, { ...news, slug: 'a slug/with?odd#characters' })
            expect(metadata.url).toBe('https://staging.communities.social/about/news/a%20slug%2Fwith%3Fodd%23characters')
        })

        it('Should cope with a post that\'s missing properties', function() {
            const metadata = buildNewsMetadata(host, { slug: 'a-post' })
            expect(metadata.title).toBe('News')
            expect(metadata.documentTitle).toBe('News -- Communities')
            expect(metadata.description).toBe(buildNewsListMetadata(host).description)
            expect(metadata.article).toEqual({ publishedTime: null, author: null })
        })

        it('Should leave out a date that isn\'t a real date', function() {
            expect(buildNewsMetadata(host, { ...news, date: '02/30/2026' }).article.publishedTime).toBeNull()
        })

        it('Should leave values unescaped for the renderer to escape', function() {
            const metadata = buildNewsMetadata(host, { ...news, title: 'Quotes " & <tags>' })
            expect(metadata.title).toBe('Quotes " & <tags>')
        })
    })
})
