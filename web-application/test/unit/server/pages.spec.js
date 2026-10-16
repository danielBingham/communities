/******************************************************************************
 * The page routes: index.html with each page's metadata rendered into its
 * <head>, so link previews show the page that was linked.
 *
 * Runs the real page router in a real Express app over HTTP, against an
 * index.html shaped like the one the production build makes and News kept by
 * the filesystem storage driver.
 ******************************************************************************/

const fs = require('fs')
const os = require('os')
const path = require('path')

// The backend's index loads modules jest can't (linkpeek is ESM-only), so
// stand in for it with just what the pages use.
jest.mock('@communities/backend', () => ({
    PageMetadataService: require('@communities/backend/services/PageMetadataService')
}))

const express = require('express')
const { JSDOM } = require('jsdom')

const FilesystemStorage = require('@communities/backend/services/storage/FilesystemStorage')
const Logger = require('@communities/backend/logger')

const { createPageRouter } = require('../../../server/pages')
const PageController = require('../../../server/controllers/PageController')

// Shaped like the production build's index.html: minified, with the markers
// kept and the static default metadata between them.
const INDEX_HTML = '<!doctype html><html lang="en"><head><meta charset="UTF-8"/>'
    + '<meta name="application-name" content="Communities"/>'
    + '<!--! page-metadata:start --><title>Static Title</title>'
    + '<meta name="description" content="Static description."/>'
    + '<meta property="og:title" content="Static Title"/><!--! page-metadata:end -->'
    + '<link rel="icon" href="/marque.svg" sizes="any"/>'
    + '<meta name="communities-host" content="https://localhost:3000">'
    + '<script defer="defer" src="/main.abc123.bundle.js"></script>'
    + '</head><body><div id="root"></div></body></html>'

describe('Page routes', function() {
    let directory = null
    let core = null
    let server = null
    let origin = null

    const writeIndexHTML = function(html) {
        fs.mkdirSync(path.join(directory, 'public/dist'), { recursive: true })
        fs.writeFileSync(path.join(directory, 'public/dist/index.html'), html)
    }

    const writeNews = function(index) {
        const file = path.join(directory, 'storage/news/index.json')
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify(index))
    }

    const news = {
        title: 'Protocols Aren\'t the Answer',
        slug: '09-29-2026-protocols-arent-the-answer',
        date: '09/29/2026',
        author: 'Daniel Bingham',
        content: '# Protocols\n\nThere\'s been a lot of talk about **protocols** lately.'
    }

    // Start the app.  PageController reads index.html relative to the working
    // directory, as it does in the container.
    const start = async function(environment) {
        jest.spyOn(process, 'cwd').mockReturnValue(directory)

        const logger = new Logger()
        logger.level = -1
        core = {
            config: { environment: environment ?? 'production', host: 'https://communities.social' },
            logger: logger
        }

        // The filesystem driver may only be configured in development, but
        // the pages behave differently there, so give it a core of its own.
        const storageCore = { config: { environment: 'development', host: core.config.host }, logger: logger }
        core.storage = new FilesystemStorage(storageCore, { directory: path.join(directory, 'storage'), secret: 'secret' })

        const app = express()
        app.use(function(request, response, next) {
            request.logger = logger
            next()
        })
        app.use(createPageRouter(core))
        app.use(function(error, request, response, next) {
            response.status(500).json({ error: error.message })
        })

        await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve) })
        origin = `http://127.0.0.1:${server.address().port}`
    }

    // Request a page the way a crawler would, and read its <head>.
    const getPage = async function(pagePath, options) {
        const response = await fetch(`${origin}${pagePath}`, { headers: { 'Accept': 'text/html' }, ...options })
        const html = await response.text()
        const { document } = new JSDOM(html).window
        const content = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null

        return {
            response: response,
            html: html,
            document: document,
            title: document.title,
            titles: document.querySelectorAll('title').length,
            description: content('meta[name="description"]'),
            canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
            og: (property) => content(`meta[property="${property}"]`)
        }
    }

    beforeEach(function() {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'communities-pages-'))
        writeIndexHTML(INDEX_HTML)
        writeNews({ [news.slug]: news })
    })

    afterEach(async function() {
        jest.restoreAllMocks()
        if ( server ) {
            await new Promise((resolve) => server.close(resolve))
            server = null
        }
        fs.rmSync(directory, { recursive: true, force: true })
    })

    describe('GET /about/news/:slug', function() {
        it('Should send the post\'s metadata', async function() {
            await start()
            const page = await getPage(`/about/news/${news.slug}`)

            expect(page.response.status).toBe(200)
            expect(page.title).toBe('Protocols Aren\'t the Answer -- Communities')
            expect(page.titles).toBe(1)
            expect(page.description).toBe('There\'s been a lot of talk about protocols lately.')
            expect(page.canonical).toBe(`https://communities.social/about/news/${news.slug}`)
            expect(page.og('og:title')).toBe('Protocols Aren\'t the Answer')
            expect(page.og('og:type')).toBe('article')
            expect(page.og('og:url')).toBe(`https://communities.social/about/news/${news.slug}`)
            expect(page.og('og:image')).toBe('https://communities.social/social-sharing-image.jpg')
            expect(page.og('article:published_time')).toBe('2026-09-29')
        })

        it('Should leave the rest of index.html as it is', async function() {
            await start()
            const page = await getPage(`/about/news/${news.slug}`)

            expect(page.html).not.toContain('Static')
            expect(page.html.startsWith('<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="application-name" content="Communities"/><!--! page-metadata:start -->\n')).toBe(true)
            expect(page.html.endsWith('<!--! page-metadata:end --><link rel="icon" href="/marque.svg" sizes="any"/>'
                + '<meta name="communities-host" content="https://localhost:3000">'
                + '<script defer="defer" src="/main.abc123.bundle.js"></script>'
                + '</head><body><div id="root"></div></body></html>')).toBe(true)
        })

        it('Should send HTML that browsers check before reusing', async function() {
            await start()
            const page = await getPage(`/about/news/${news.slug}`)

            expect(page.response.headers.get('content-type')).toBe('text/html; charset=utf-8')
            expect(page.response.headers.get('cache-control')).toBe('no-cache')
            expect(page.response.headers.get('etag')).toBeTruthy()
        })

        it('Should send 404 and the default metadata for a post that doesn\'t exist', async function() {
            await start()
            const page = await getPage('/about/news/01-01-2000-no-such-post')

            expect(page.response.status).toBe(404)
            expect(page.title).toBe('Communities -- Cooperative Social Media')
            expect(page.canonical).toBeNull()
            expect(page.og('og:url')).toBeNull()
            // Still the app, so the client can show its 404 page.
            expect(page.html).toContain('<div id="root"></div>')
        })

        it('Should answer HEAD requests', async function() {
            await start()
            const response = await fetch(`${origin}/about/news/${news.slug}`, { method: 'HEAD' })

            expect(response.status).toBe(200)
            expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
        })

        it('Should send the default metadata when getting the post\'s fails', async function() {
            await start()
            jest.spyOn(FilesystemStorage.prototype, 'getFile').mockRejectedValue(new Error('Storage is down.'))

            const page = await getPage(`/about/news/${news.slug}`)

            expect(page.response.status).toBe(200)
            expect(page.title).toBe('Communities -- Cooperative Social Media')
            expect(page.html).toContain('<div id="root"></div>')
        })

        it('Should send the default metadata when getting the post takes too long', async function() {
            const timeout = PageController.METADATA_TIMEOUT
            PageController.METADATA_TIMEOUT = 50
            try {
                await start()
                jest.spyOn(FilesystemStorage.prototype, 'getFile').mockReturnValue(new Promise(() => {}))

                const started = Date.now()
                const page = await getPage(`/about/news/${news.slug}`)

                expect(Date.now() - started).toBeLessThan(1000)
                expect(page.response.status).toBe(200)
                expect(page.title).toBe('Communities -- Cooperative Social Media')
            } finally {
                PageController.METADATA_TIMEOUT = timeout
            }
        })
    })

    describe('GET /about/news', function() {
        it('Should send the News page\'s metadata, with or without a trailing slash or page', async function() {
            await start()

            for(const pagePath of [ '/about/news', '/about/news/', '/about/news?page=2' ]) {
                const page = await getPage(pagePath)
                expect(page.response.status).toBe(200)
                expect(page.title).toBe('News -- Communities')
                expect(page.canonical).toBe('https://communities.social/about/news')
            }
        })
    })

    describe('GET /', function() {
        it('Should send the home page\'s metadata', async function() {
            await start()
            const page = await getPage('/')

            expect(page.response.status).toBe(200)
            expect(page.title).toBe('Communities -- Cooperative Social Media')
            expect(page.canonical).toBe('https://communities.social/')
        })
    })

    describe('Every other page', function() {
        it('Should send the default metadata, without claiming to be another page', async function() {
            await start()

            for(const pagePath of [ '/login', '/about/faq', '/some-user/some-post', '/group/a-group/members' ]) {
                const page = await getPage(pagePath)
                expect(page.response.status).toBe(200)
                expect(page.title).toBe('Communities -- Cooperative Social Media')
                expect(page.og('og:image')).toBe('https://communities.social/social-sharing-image.jpg')
                expect(page.canonical).toBeNull()
                expect(page.og('og:url')).toBeNull()
            }
        })
    })

    describe('index.html', function() {
        it('Should be read once outside of development', async function() {
            await start('production')
            await getPage('/')

            writeIndexHTML(INDEX_HTML.replace('main.abc123', 'main.def456'))
            expect((await getPage('/')).html).toContain('main.abc123')
        })

        it('Should be read for every request in development, where webpack rebuilds it', async function() {
            await start('development')
            await getPage('/')

            writeIndexHTML(INDEX_HTML.replace('main.abc123', 'main.def456'))
            expect((await getPage('/')).html).toContain('main.def456')
        })

        it('Should be sent as it is when it\'s missing the markers', async function() {
            const html = INDEX_HTML.replace('<!--! page-metadata:start -->', '')
            writeIndexHTML(html)
            await start()

            const page = await getPage(`/about/news/${news.slug}`)
            expect(page.response.status).toBe(200)
            expect(page.html).toBe(html)
        })
    })
})
