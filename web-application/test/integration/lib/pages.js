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

const API_ROOT = process.env.API_ROOT ?? 'https://localhost:3000/api/0.0.0/'

// The HTML escapes Handlebars uses, undone.
const unescapeHTML = function(text) {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, '\'')
        .replace(/&#x60;/g, '`')
        .replace(/&#x3D;/g, '=')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
}

// Request a page of the web application, the way a link preview crawler
// would, and pick out its metadata and preloaded entities.  Pages are served
// from the root of the host the API is on.
//
// Returns { status, html, title, description, canonical, og(property),
// preloaded }.  Values are null when the page doesn't have that tag.
// `preloaded` is the entities the page came with, shaped like an API
// response's relations: { news: { 'a-post': { ... } } }.
const fetchPage = async function(pagePath) {
    if ( API_ROOT.startsWith('https://communities.social') || API_ROOT.startsWith('http://communities.social') ) {
        throw new Error('Integration tests may not be run against production!')
    }

    const url = new URL(pagePath, API_ROOT)
    const response = await fetch(url.href, {
        headers: {
            'Accept': 'text/html',
            'User-Agent': 'CommunitiesBot-LinkExpanding 1.0 (+https://communities.social) Integration Tests'
        }
    })
    const html = await response.text()

    const find = function(pattern) {
        const match = html.match(pattern)
        return match ? unescapeHTML(match[1]) : null
    }

    const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Script content isn't HTML escaped, so it's parsed as it is.
    const preloaded = html.match(/<script type="application\/json" id="communities-preloaded-entities">([^<]*)<\/script>/)

    return {
        status: response.status,
        html: html,
        title: find(/<title>([^<]*)<\/title>/),
        description: find(/<meta name="description" content="([^"]*)"/),
        canonical: find(/<link rel="canonical" href="([^"]*)"/),
        og: (property) => find(new RegExp(`<meta property="${escapeRegExp(property)}" content="([^"]*)"`)),
        preloaded: preloaded ? JSON.parse(preloaded[1]) : null
    }
}

module.exports = {
    fetchPage: fetchPage
}
