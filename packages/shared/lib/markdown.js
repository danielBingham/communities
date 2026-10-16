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

/**
 * The characters a backslash can escape in Markdown.
 */
const ESCAPABLE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g

/**
 * Escaped characters are swapped for characters from Unicode's Private Use
 * Area while the rest of the syntax is removed, so that `\*` isn't mistaken
 * for emphasis, and swapped back at the end.
 */
const PRIVATE_USE_START = 0xE000
const PRIVATE_USE = /[-]/g

/**
 * The text of a Markdown document as it should read in a preview, such as a
 * link preview's description: one line of plain text, with the syntax
 * removed.
 *
 * Only the prose is kept:
 *  - Links, emphasis and inline code keep their text.
 *  - Headings, code blocks, images, raw HTML tags, horizontal rules and link
 *    reference definitions are left out: they're structure or decoration,
 *    and read badly run together with the prose around them.
 *  - Block quotes and lists keep their text, without their markers.
 *
 * This isn't a full CommonMark parser.  It handles the Markdown we write,
 * and anything it doesn't recognize comes through as text, which is the
 * right failure for a preview.
 *
 * @param {string} markdown The Markdown.
 *
 * @return {string} The plain text, or '' when there's none.
 */
const toPreviewText = function(markdown) {
    if ( typeof markdown !== 'string' ) {
        return ''
    }

    let text = markdown.replace(/\r\n?/g, '\n')

    // Escapes first, so the characters they protect aren't read as syntax.
    text = text.replace(ESCAPABLE, (match, character) => String.fromCharCode(PRIVATE_USE_START + character.charCodeAt(0)))

    // ===== Blocks =====

    // Fenced code blocks, to the closing fence or, if it's missing, the end.
    text = text.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[`~]*[ \t]*$|(?![\s\S]))/gm, '')

    // HTML comments.
    text = text.replace(/<!--[\s\S]*?(?:-->|$)/g, '')

    // Setext headings: a line of text underlined with = or -.
    text = text.replace(/^[^\n]*\S[^\n]*\n {0,3}(?:=+|-+)[ \t]*$/gm, '')

    const lines = []
    let inIndentedCode = false
    let previousBlank = true
    for(const line of text.split('\n')) {
        const blank = line.trim() === ''

        // Indented code: four spaces (or a tab) in, after a blank line.
        if ( /^(?: {4}|\t)/.test(line) && ( previousBlank || inIndentedCode ) && ! blank ) {
            inIndentedCode = true
            previousBlank = false
            continue
        }
        if ( ! blank ) {
            inIndentedCode = false
        }
        previousBlank = blank

        // ATX headings, horizontal rules and link reference definitions.
        if ( /^ {0,3}#{1,6}(?:[ \t]|$)/.test(line)
            || /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(line)
            || /^ {0,3}\[[^\]]+\]:[ \t]*\S/.test(line) ) {
            continue
        }

        lines.push(line
            // Block quote markers, however deeply nested.
            .replace(/^(?: {0,3}>[ \t]?)+/, '')
            // List markers and task list checkboxes.
            .replace(/^[ \t]*(?:[-*+]|\d{1,9}[.)])[ \t]+(?:\[[ xX]\][ \t]+)?/, '')
        )
    }
    text = lines.join('\n')

    // ===== Inlines =====

    // Images, inline and by reference.
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    text = text.replace(/!\[[^\]]*\]\[[^\]]*\]/g, '')

    // Links keep their text: inline, by reference and autolinks.
    text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    text = text.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    text = text.replace(/<((?:https?|mailto):[^\s<>]+)>/gi, '$1')

    // Raw HTML tags (react-markdown shows them as text, but they don't
    // belong in a preview).
    text = text.replace(/<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?\/?>/g, '')

    // Inline code keeps its text.
    text = text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (match, ticks, code) => code.trim())

    // Strong, emphasis and strikethrough keep their text.  Underscores only
    // emphasize at word boundaries, so snake_case stays as it is.
    text = text.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '$1')
    text = text.replace(/(^|[^\p{L}\p{N}])__(?=\S)([\s\S]*?\S)__(?![\p{L}\p{N}])/gu, '$1$2')
    text = text.replace(/\*(?=\S)([\s\S]*?\S)\*/g, '$1')
    text = text.replace(/(^|[^\p{L}\p{N}])_(?=\S)([\s\S]*?\S)_(?![\p{L}\p{N}])/gu, '$1$2')
    text = text.replace(/~~(?=\S)([\s\S]*?\S)~~/g, '$1')

    // Hard line breaks made with a trailing backslash.
    text = text.replace(/\\\n/g, '\n')

    // Put the escaped characters back.
    text = text.replace(PRIVATE_USE, (character) => String.fromCharCode(character.charCodeAt(0) - PRIVATE_USE_START))

    return text.replace(/\s+/g, ' ').trim()
}

module.exports = {
    toPreviewText: toPreviewText
}
