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
const { parseUSDate } = require('./date')

/**
 * Turn text into URL words: lowercase letters and numbers separated by single
 * hyphens.  Accents are dropped from letters and apostrophes are dropped
 * entirely, so "Aren't" becomes "arent" rather than "aren-t".
 *
 * @param {string} text The text to turn into a slug.
 *
 * @return {string} The slug, or '' when `text` has no letters or numbers.
 */
const slugify = function(text) {
    if ( typeof text !== 'string' ) {
        return ''
    }

    return text
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/['‘’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * Generate the slug for a News post from its date and title, hyphen
 * separated: ('09/30/2026', "Protocols Aren't the Answer") becomes
 * '09-30-2026-protocols-arent-the-answer'.
 *
 * @param {string} date     The post's date, 'MM/DD/YYYY'.
 * @param {string} title    The post's title.
 *
 * @return {string} The slug.  Partial when either part is empty, so it can be
 * shown while the form is being filled in.
 */
const generateNewsSlug = function(date, title) {
    return [ slugify(date), slugify(title) ]
        .filter((part) => part !== '')
        .join('-')
}

/**
 * Turn a News post's date into a number that sorts chronologically:
 * '09/30/2026' becomes 20260930.
 *
 * @param {string} date     The post's date, 'MM/DD/YYYY'.
 *
 * @return {number} The sort key, or -Infinity when `date` isn't a valid date,
 * so invalid dates sort last when sorting newest first.
 */
const getNewsDateSortKey = function(date) {
    const parsed = parseUSDate(date)
    if ( parsed === null ) {
        return -Infinity
    }

    return parsed.year * 10000 + parsed.month * 100 + parsed.day
}

/**
 * Sort a list of News posts newest first.
 *
 * Posts on the same date keep the order they're given in, so callers decide
 * how ties are broken.
 *
 * @param {Object[]} newsList   The posts to sort.  Not modified.
 *
 * @return {Object[]} A new, sorted array.
 */
const sortNewsByDateDescending = function(newsList) {
    return [ ...newsList ].sort(function(a, b) {
        const aKey = getNewsDateSortKey(a.date)
        const bKey = getNewsDateSortKey(b.date)

        if ( aKey === bKey ) {
            return 0
        }

        return aKey < bKey ? 1 : -1
    })
}

module.exports = {
    slugify: slugify,
    generateNewsSlug: generateNewsSlug,
    getNewsDateSortKey: getNewsDateSortKey,
    sortNewsByDateDescending: sortNewsByDateDescending
}
