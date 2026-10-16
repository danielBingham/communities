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
const { lib } = require('@communities/shared')

const ServiceError = require('../errors/ServiceError')

/**
 * Keeps the posts on the News page (/about/news).
 *
 * News is a flat file CMS: rather than living in the database, every post is
 * kept in a single JSON file in storage (S3 in staging and production),
 * `news/index.json`, keyed by slug:
 *
 *  {
 *      "09-29-2026-protocols-arent-the-answer": {
 *          "title": "Protocols Aren't the Answer",
 *          "slug": "09-29-2026-protocols-arent-the-answer",
 *          "date": "09/29/2026",
 *          "author": "Daniel Bingham",
 *          "content": "<Markdown>"
 *      },
 *      ...
 *  }
 *
 * The file is written pretty printed so it can be read and, in a pinch,
 * edited by hand.
 *
 * TECHDEBT Changes are made by reading the whole file, changing it and
 * writing it back, with nothing to stop two changes from overlapping.  If
 * two changes are made at the same moment, both read the same index and the
 * one saved last overwrites the other, which is lost.  We're accepting that
 * risk for now: only one admin writes News, so a collision would mean they
 * collided with themselves.  When more admins can post, this service should
 * be rewritten to make changes safely (S3 conditional writes, or moving News
 * into the database).
 */
module.exports = class NewsService {

    /**
     * Where the posts are kept in storage.
     */
    static INDEX_PATH = 'news/index.json'

    /**
     * How many posts are on each page of GET /news.
     */
    static PAGE_SIZE = 5

    constructor(core) {
        this.core = core
        this.storage = core.storage
    }

    /**
     * Copy a post with its properties in a consistent order, leaving out
     * anything that isn't part of a post.
     *
     * @param {Object} news     The post.
     * @param {string} slug     The post's slug.  The index's key is the source
     * of truth for the slug.
     *
     * @return {Object} The copy.
     */
    toEntity(news, slug) {
        return {
            title: news.title,
            slug: slug,
            date: news.date,
            author: news.author,
            content: news.content
        }
    }

    /**
     * Whether an entry in the index is a post we can show.  The index may
     * have been edited by hand, and one broken entry shouldn't take down the
     * News page, so broken entries are logged and skipped.
     *
     * @param {*} news  The entry.
     * @param {string} slug     The entry's key.
     *
     * @return {boolean}
     */
    isPost(news, slug) {
        if ( news === null || typeof news !== 'object' || Array.isArray(news) ) {
            this.core.logger.warn(`Skipping News(${slug}) in '${NewsService.INDEX_PATH}': it isn't an object.`)
            return false
        }

        return true
    }

    /**
     * Read the index from storage.
     *
     * @return {Promise<Object>} The posts, keyed by slug.  Empty when nothing
     * has been posted yet.
     *
     * @throws {ServiceError} 'invalid-index' when the file isn't a JSON
     * object.
     */
    async getIndex() {
        const hasIndex = await this.storage.hasFile(NewsService.INDEX_PATH)
        if ( ! hasIndex ) {
            return {}
        }

        const contents = await this.storage.getFile(NewsService.INDEX_PATH)

        let index = null
        try {
            index = JSON.parse(Buffer.from(contents).toString('utf8'))
        } catch (error) {
            throw new ServiceError('invalid-index', `'${NewsService.INDEX_PATH}' isn't valid JSON: ${error.message}`)
        }

        if ( index === null || typeof index !== 'object' || Array.isArray(index) ) {
            throw new ServiceError('invalid-index', `'${NewsService.INDEX_PATH}' must be a JSON object of posts keyed by slug.`)
        }

        return index
    }

    /**
     * Write the index to storage, replacing what's there.
     *
     * @param {Object} index    The posts, keyed by slug.
     */
    async saveIndex(index) {
        const contents = Buffer.from(JSON.stringify(index, null, 4) + '\n', 'utf8')
        await this.storage.uploadFileFromBuffer(contents, NewsService.INDEX_PATH, 'application/json')
    }

    /**
     * Get one page of posts, newest first.
     *
     * @param {number} page     Which page to get, counting from 1.  Past the
     * last page, the page is empty.
     *
     * @return {Promise<Object>} `{ dictionary, list, meta }`: the page's posts
     * keyed by slug, their slugs in order and the page's metadata
     * (`{ count, page, pageSize, numberOfPages }`), like our other list
     * endpoints return.
     */
    async getNewsPage(page) {
        const index = await this.getIndex()

        // Sort newest first.  The sort keeps posts on the same date in the
        // order it's given them, so reversing the index (which keeps the order
        // posts were added in) first puts the most recently added post on a
        // date first.
        const posts = Object.entries(index)
            .filter(([slug, news]) => this.isPost(news, slug))
            .map(([slug, news]) => this.toEntity(news, slug))
            .reverse()
        const sorted = lib.news.sortNewsByDateDescending(posts)

        const pageSize = NewsService.PAGE_SIZE
        const start = (page - 1) * pageSize

        const dictionary = {}
        const list = []
        for(const news of sorted.slice(start, start + pageSize)) {
            dictionary[news.slug] = news
            list.push(news.slug)
        }

        return {
            dictionary: dictionary,
            list: list,
            meta: {
                count: sorted.length,
                page: page,
                pageSize: pageSize,
                numberOfPages: Math.ceil(sorted.length / pageSize)
            }
        }
    }

    /**
     * Get one post.
     *
     * @param {string} slug     The post's slug.
     *
     * @return {Promise<Object|null>} The post, or null when there's no post
     * with that slug.
     */
    async getNews(slug) {
        const index = await this.getIndex()

        // `slug` comes from the URL: make sure it names a post rather than
        // something every object has, like 'constructor'.
        if ( ! Object.hasOwn(index, slug) || ! this.isPost(index[slug], slug) ) {
            return null
        }

        return this.toEntity(index[slug], slug)
    }

    /**
     * Add a post.
     *
     * @param {Object} news     The post, with all of its properties.  Should
     * already be validated.
     *
     * @return {Promise<Object>} The post as saved.
     *
     * @throws {ServiceError} 'conflict' when there's already a post with that
     * slug.
     */
    async createNews(news) {
        // TECHDEBT Not safe against a simultaneous change.  See the class
        // comment.
        const index = await this.getIndex()

        if ( Object.hasOwn(index, news.slug) ) {
            throw new ServiceError('conflict', `News(${news.slug}) already exists.`)
        }

        index[news.slug] = this.toEntity(news, news.slug)
        await this.saveIndex(index)

        return index[news.slug]
    }

    /**
     * Change some of a post's properties.  The slug can't be changed.
     *
     * @param {string} slug     The post's slug.
     * @param {Object} patch    The properties to change.  Should already be
     * validated.
     *
     * @return {Promise<Object>} The post as saved.
     *
     * @throws {ServiceError} 'not-found' when there's no post with that slug.
     */
    async updateNews(slug, patch) {
        // TECHDEBT Not safe against a simultaneous change.  See the class
        // comment.
        const index = await this.getIndex()

        if ( ! Object.hasOwn(index, slug) ) {
            throw new ServiceError('not-found', `News(${slug}) doesn't exist.`)
        }

        index[slug] = this.toEntity({ ...index[slug], ...patch }, slug)
        await this.saveIndex(index)

        return index[slug]
    }

    /**
     * Remove a post.
     *
     * @param {string} slug     The post's slug.
     *
     * @return {Promise<Object>} The post that was removed.
     *
     * @throws {ServiceError} 'not-found' when there's no post with that slug.
     */
    async deleteNews(slug) {
        // TECHDEBT Not safe against a simultaneous change.  See the class
        // comment.
        const index = await this.getIndex()

        if ( ! Object.hasOwn(index, slug) ) {
            throw new ServiceError('not-found', `News(${slug}) doesn't exist.`)
        }

        const news = this.toEntity(index[slug], slug)
        delete index[slug]
        await this.saveIndex(index)

        return news
    }
}
