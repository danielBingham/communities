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

module.exports = class LinkPreviewService {
    constructor(core) {
        this.core = core
    }

    async getPreview(url) {
        const response = await fetch(url)

        if ( ! response.ok) {
            throw new ServiceError('invalid-url', `That URL was not valid.`)
        }

        const data = await response.text()

        const parser = new DOMParser()
        const doc = new parser.parseFromString(data, 'text/html')

        const title = doc.querySelector('title')?.textContent || '';
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

        return {
            title: title,
            description: description,
            imageUrl: image
        }
    }
}
