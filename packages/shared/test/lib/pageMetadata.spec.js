const { lib } = require('../../')

const {
    DEFAULT_TITLE,
    DEFAULT_DESCRIPTION,
    DESCRIPTION_LENGTH,
    toAbsoluteURL,
    getDocumentTitle,
    truncate,
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

    describe('truncate()', function() {
        it('Should leave text that fits alone', function() {
            expect(truncate('Short enough.', 13)).toBe('Short enough.')
            expect(truncate('', 10)).toBe('')
        })

        it('Should return an empty string for anything that isn\'t text', function() {
            expect(truncate(undefined, 10)).toBe('')
            expect(truncate(null, 10)).toBe('')
        })

        it('Should cut at a word boundary and add an ellipsis', function() {
            const result = truncate('The quick brown fox jumps over the lazy dog.', 20)
            expect(result).toBe('The quick brown fox…')
            expect(Array.from(result).length).toBeLessThanOrEqual(20)
        })

        it('Should not leave punctuation before the ellipsis', function() {
            expect(truncate('Funded by users, governed by members.', 17)).toBe('Funded by users…')
        })

        it('Should cut a very long word rather than throw everything away', function() {
            expect(truncate('Supercalifragilisticexpialidocious', 10)).toBe('Supercali…')
        })

        it('Should never cut an emoji in half', function() {
            const result = truncate('🎉'.repeat(20), 10)
            expect(Array.from(result)).toEqual([ ...Array(9).fill('🎉'), '…' ])
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
                    url: 'https://staging.communities.social/social-sharing-image.jpg',
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
            content: '# Protocols\n\nThere\'s been a lot of talk about **protocols** lately.  [Bluesky](https://bsky.app) and the fediverse are both built on them.'
        }

        it('Should describe the post as an article', function() {
            expect(buildNewsMetadata(host, news)).toEqual({
                ...buildDefaultMetadata(host),
                title: 'Protocols Aren\'t the Answer',
                documentTitle: 'Protocols Aren\'t the Answer -- Communities',
                description: 'There\'s been a lot of talk about protocols lately. Bluesky and the fediverse are both built on them.',
                url: 'https://staging.communities.social/about/news/09-29-2026-protocols-arent-the-answer',
                type: 'article',
                article: {
                    publishedTime: '2026-09-29',
                    author: 'Daniel Bingham'
                }
            })
        })

        it('Should shorten a long post\'s description', function() {
            const metadata = buildNewsMetadata(host, { ...news, content: 'Words and more words. '.repeat(50) })
            expect(Array.from(metadata.description).length).toBeLessThanOrEqual(DESCRIPTION_LENGTH)
            expect(metadata.description.endsWith('…')).toBe(true)
        })

        it('Should fall back to the News description when the post has no prose', function() {
            const metadata = buildNewsMetadata(host, { ...news, content: '# Just a heading\n\n![An image](/a.png)' })
            expect(metadata.description).toBe(buildNewsListMetadata(host).description)
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
