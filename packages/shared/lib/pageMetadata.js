/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media
 *  Copyright (C) 2022 - 2024 Daniel Bingham
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
/******************************************************************************
 * Page Metadata
 *
 * The title, description and social sharing (Open Graph) details of a page,
 * which go in the <head> of index.html.  Link previews (Facebook, X, Slack,
 * Discord, Mastodon, iMessage, our own link previews...) are built from these
 * tags by crawlers that don't run JavaScript, so the server has to render
 * them into the index.html it sends.  See the backend's PageMetadataService.
 *
 * These are pure functions of an entity and the host so that, later, the
 * client can use them to keep the <head> up to date as people navigate.
 *
 * A metadata object:
 *
 *  {
 *      siteName: 'Communities',                        // og:site_name
 *      title: "Protocols Aren't the Answer",           // og:title
 *      documentTitle: "Protocols Aren't the Answer -- Communities", // <title>
 *      description: 'A plain text summary.',           // description, og:description
 *      url: 'https://communities.social/about/news/...', // canonical, og:url
 *      type: 'article',                                // og:type, 'website' or 'article'
 *      image: { url, width, height, alt },             // og:image
 *      article: {                                      // Only when type is 'article'.
 *          publishedTime: '2026-09-29',                // article:published_time
 *          author: 'Daniel Bingham'                    // author
 *      }
 *  }
 *
 * Values are plain, unescaped text.  Escaping them is the renderer's job.
 *
 * `url` is null for pages that don't have metadata of their own.  Without
 * og:url, crawlers use the URL they were given, which is what we want: a
 * page with the default metadata shouldn't claim to be the home page.
 * (Facebook treats og:url as canonical and uses the metadata found *there*,
 * so pointing every page at the home page collapses all of their previews
 * into the home page's.)
 ******************************************************************************/
const { parseUSDate } = require('./date')
const markdown = require('./markdown')

const SITE_NAME = 'Communities'

const DEFAULT_TITLE = 'Communities -- Cooperative Social Media'

const DEFAULT_DESCRIPTION = 'A social media platform that will be a non-profit, cooperative. Funded by users. Governed by those who build it and use it, together.'

/**
 * The image shown in link previews for every page that doesn't have one of
 * its own.  Served from `web-application/public/`.  1200x630 is the size
 * Facebook, LinkedIn and X's large card recommend.
 */
const DEFAULT_IMAGE = {
    path: '/social-sharing-image.jpg',
    width: 1200,
    height: 630,
    alt: 'A phone showing a Communities feed.'
}

/**
 * The longest a description may be, in characters.  Search results show
 * about 160 characters and link previews about 200 before they cut it off.
 */
const DESCRIPTION_LENGTH = 200

const NEWS_TITLE = 'News'
const NEWS_DESCRIPTION = 'News and updates from the people building Communities.'

/**
 * Make a URL absolute.  Crawlers need absolute URLs for og:url and og:image.
 *
 * @param {string} host     The site's origin, e.g. 'https://communities.social'.
 * @param {string} path     The path, e.g. '/about/news'.
 *
 * @return {string} The absolute URL.
 */
const toAbsoluteURL = function(host, path) {
    return new URL(path, host).href
}

/**
 * The text for a page's <title>, which is shown in browser tabs, bookmarks
 * and search results.
 *
 * @param {string} title    The page's title.
 *
 * @return {string} The title with the site's name.
 */
const getDocumentTitle = function(title) {
    return `${title} -- ${SITE_NAME}`
}

/**
 * Shorten text to at most `maxLength` characters, at a word boundary when
 * there's one close enough, ending it with an ellipsis when it was cut.
 *
 * Counts characters rather than UTF-16 code units, so it never cuts an emoji
 * or other astral character in half.
 *
 * @param {string} text         The text.
 * @param {number} maxLength    The most characters to keep, including the
 * ellipsis.
 *
 * @return {string} The text, shortened if it needed to be.
 */
const truncate = function(text, maxLength) {
    if ( typeof text !== 'string' ) {
        return ''
    }

    const characters = Array.from(text)
    if ( characters.length <= maxLength ) {
        return text
    }

    // Leave room for the ellipsis.
    let cut = characters.slice(0, maxLength - 1).join('')

    // When the cut splits a word, back up to the end of the last whole word,
    // unless that throws away too much (one very long word).
    const splitsWord = /\S/.test(characters[maxLength - 1]) && /\S$/.test(cut)
    const lastSpace = cut.search(/\s\S*$/)
    if ( splitsWord && lastSpace > maxLength / 2 ) {
        cut = cut.slice(0, lastSpace)
    }

    // Don't leave dangling punctuation before the ellipsis.
    cut = cut.replace(/[\s,;:.!?\-–—]+$/u, '')

    return `${cut}…`
}

/**
 * The image object for a metadata object.
 *
 * @param {string} host The site's origin.
 * @param {Object} image    { path, width, height, alt }
 *
 * @return {Object} { url, width, height, alt }
 */
const buildImage = function(host, image) {
    return {
        url: toAbsoluteURL(host, image.path),
        width: image.width,
        height: image.height,
        alt: image.alt
    }
}

/**
 * The metadata for a page that doesn't have metadata of its own.
 *
 * @param {string} host The site's origin, e.g. 'https://communities.social'.
 *
 * @return {Object} The metadata.  See the top of this file.
 */
const buildDefaultMetadata = function(host) {
    return {
        siteName: SITE_NAME,
        title: DEFAULT_TITLE,
        documentTitle: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        url: null,
        type: 'website',
        image: buildImage(host, DEFAULT_IMAGE),
        article: null
    }
}

/**
 * The metadata for the home page: '/'.
 *
 * @param {string} host The site's origin.
 *
 * @return {Object} The metadata.
 */
const buildRootMetadata = function(host) {
    return {
        ...buildDefaultMetadata(host),
        url: toAbsoluteURL(host, '/')
    }
}

/**
 * The metadata for the list of News posts: '/about/news'.
 *
 * @param {string} host The site's origin.
 *
 * @return {Object} The metadata.
 */
const buildNewsListMetadata = function(host) {
    return {
        ...buildDefaultMetadata(host),
        title: NEWS_TITLE,
        documentTitle: getDocumentTitle(NEWS_TITLE),
        description: NEWS_DESCRIPTION,
        url: toAbsoluteURL(host, '/about/news')
    }
}

/**
 * The metadata for a News post: '/about/news/:slug'.
 *
 * Posts don't have a summary or an image of their own (yet), so the
 * description is the start of the post's content and the image is the
 * default one.  The posts come from a file that can be edited by hand, so
 * this copes with missing or mistyped properties rather than trusting them.
 *
 * @param {string} host The site's origin.
 * @param {Object} news The post: { title, slug, date, author, content }.
 *
 * @return {Object} The metadata.
 */
const buildNewsMetadata = function(host, news) {
    const title = typeof news.title === 'string' && news.title.trim() !== '' ? news.title.trim() : NEWS_TITLE

    let description = truncate(markdown.toPreviewText(news.content), DESCRIPTION_LENGTH)
    if ( description === '' ) {
        description = NEWS_DESCRIPTION
    }

    const date = parseUSDate(news.date)
    const publishedTime = date === null ? null
        : `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`

    const author = typeof news.author === 'string' && news.author.trim() !== '' ? news.author.trim() : null

    return {
        ...buildDefaultMetadata(host),
        title: title,
        documentTitle: getDocumentTitle(title),
        description: description,
        url: toAbsoluteURL(host, `/about/news/${encodeURIComponent(news.slug)}`),
        type: 'article',
        article: {
            publishedTime: publishedTime,
            author: author
        }
    }
}

module.exports = {
    SITE_NAME: SITE_NAME,
    DEFAULT_TITLE: DEFAULT_TITLE,
    DEFAULT_DESCRIPTION: DEFAULT_DESCRIPTION,
    DEFAULT_IMAGE: DEFAULT_IMAGE,
    DESCRIPTION_LENGTH: DESCRIPTION_LENGTH,
    toAbsoluteURL: toAbsoluteURL,
    getDocumentTitle: getDocumentTitle,
    truncate: truncate,
    buildDefaultMetadata: buildDefaultMetadata,
    buildRootMetadata: buildRootMetadata,
    buildNewsListMetadata: buildNewsListMetadata,
    buildNewsMetadata: buildNewsMetadata
}
