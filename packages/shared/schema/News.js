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
const { stringCleaner } = require('../cleaning/types')
const { StringValidator, DateValidator } = require('../validation/types')

const Schema = require('./Schema')

/**
 * A post on the News page (/about/news).
 *
 * News isn't kept in the database.  The posts are kept together in one JSON
 * file in storage, keyed by slug (see backend/services/NewsService.js):
 *
 *  {
 *      title: 'Protocols Aren't the Answer',
 *      slug: '09-29-2026-protocols-arent-the-answer',
 *      date: '09/29/2026',
 *      author: 'Daniel Bingham',
 *      content: '<Markdown>'
 *  }
 */
module.exports = class NewsSchema extends Schema {

    /**
     * The longest a post's Markdown content may be, in characters.
     */
    static MAX_CONTENT_LENGTH = 100000

    constructor() {
        super()

        this.properties = {
            title: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('title', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(512)
                        .getErrors()
                    return errors
                }
            },
            slug: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    // The slug is the post's URL and its key in the index, so
                    // it can't be changed once the post exists.
                    const validator = new StringValidator('slug', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(512)
                        .mustMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/, `May only contain lowercase letters and numbers, separated by single hyphens.`)
                        .getErrors()
                    return errors
                }
            },
            date: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new DateValidator('date', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeValidUSDate()
                        .getErrors()
                    return errors
                }
            },
            author: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('author', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(256)
                        .getErrors()
                    return errors
                }
            },
            content: {
                // Not trimmed: leading indentation is meaningful in Markdown
                // (an indented first line is a code block).
                clean: (value) => { return value },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('content', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(NewsSchema.MAX_CONTENT_LENGTH + 1)
                        .getErrors()

                    // mustNotBeEmpty() lets whitespace through, and blank
                    // Markdown renders as an empty post.
                    if ( errors.length === 0 && typeof value === 'string' && value.trim() === '' ) {
                        errors.push({
                            type: `content:required`,
                            log: `content is required.`,
                            message: `content is required.`
                        })
                    }
                    return errors
                }
            }
        }
    }
}
