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

const ServiceError = require('../errors/ServiceError')

const jsdom = require('jsdom')

module.exports = class LinkPreviewService {
    constructor(core) {
        this.core = core
    }

    async getPreview(url) {
        const response = await fetch(url)

        if ( ! response.ok) {
            throw new ServiceError('request-failed', `Attempt to retrieve a link preview failed with status: ${response.status}`)
        }

        const data = await response.text()

        const dom = new jsdom.JSDOM(data)
        const doc = dom.window.document

        // Default to the Open Graph values and fallback to reasonable defaults if we can't find them.

        let title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || null 
        if ( title === null ) {
            title = doc.querySelector('title')?.textContent || ''
        }

        let description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || null
        if ( description === null ) {
            description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        }

        const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''

        let cannonicalUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || null
        if ( cannonicalUrl === null ) {
            cannonicalUrl = url
        }

        let siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || null
        if ( siteName === null ) {
            const urlObj = new URL(url)
            siteName = urlObj.hostname
        }

        let type = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') || null
        if ( type === null ) {
            type = 'website'
        }

        return {
            url: cannonicalUrl,
            title: title,
            type: type,
            siteName: siteName,
            description: description,
            imageUrl: image
        }
    }
}
