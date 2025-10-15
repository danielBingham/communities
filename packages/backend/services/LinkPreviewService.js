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

const fs = require('fs')
const { Buffer } = require('buffer')

const mime = require('mime')
const jsdom = require('jsdom')
const { v4: uuidv4 } = require('uuid')

const FileDAO = require('../daos/FileDAO')

const S3FileService = require('./S3FileService')

module.exports = class LinkPreviewService {
    constructor(core) {
        this.core = core

        this.fileDAO = new FileDAO(core)

        this.fileService = new S3FileService(core)
    }

    async getPreview(url, headers) {
        let rootUrl = null
        try {
            rootUrl = new URL(url)
        } catch (error) {
            throw new ServiceError('invalid-url', `Failed to parse the provided url.`)
        }

        if ( rootUrl === null ) {
            throw new ServiceError('invalid-url', `Failed to parse the provided url.`)
        }

        const scrapeHeaders = {
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding':'gzip, deflate, br',
            'Accept-Language':'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': headers['sec-ch-ua'],
            'Sec-Ch-Ua-Mobile': headers['sec-ch-ua-mobile'],
            'Sec-Ch-Ua-Platform': headers['sec-ch-ua-platform'],
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User':'?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': headers['user-agent'],
        }
        let response = await fetch(rootUrl.href, 
            {
                method: 'GET',
                headers: scrapeHeaders
            }
        )

        if ( ! response.ok) {
            this.core.logger.info(`LinkPreviewService:: User-agent failed trying raw retrieval.`)
            // If it fails with the user agent, try again without.
            response = await fetch(rootUrl.href)

            if ( ! response.ok) {
                throw new ServiceError('request-failed', `Attempt to retrieve a link preview failed with status: ${response.status}`)
            }
        }

        const data = await response.text()

        let dom = null
        try {
            dom = new jsdom.JSDOM(data)
        } catch (error) {
            this.core.logger.log(`LinkPreviewService:: Caught error while parsing document.`)
            this.core.logger.error(error)
        }

        if ( dom === null ) {
            return {
                url: url,
                title: '',
                type: '',
                siteName: '',
                description: '',
                imageUrl: '' 
            }
        }

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

        let image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
        let fileId = null
        if ( image !== '' ) {
            fileId = uuidv4()

            try {
                const imageUrl = new URL(image, rootUrl.protocol + rootUrl.host)

                const response = await fetch(imageUrl.href, { heaaders: { 'User-Agent': headers['user-agent'] }})

                if ( response.ok ) {
                    image = imageUrl.href

                    const contentType = response.headers.get('Content-Type')
                    const extension =  mime.getExtension(contentType)

                    const tmpPath = `tmp/${fileId}.${extension}`
                    const filepath = `previews/${fileId}.${extension}`

                    const blob = await response.blob()
                    const buffer = await blob.arrayBuffer()
                    fs.writeFileSync(tmpPath, Buffer.from(buffer))

                    await this.fileService.uploadFile(tmpPath, filepath)

                    this.fileService.removeLocalFile(tmpPath)

                    const file = {
                        id: fileId,
                        userId: null,
                        type: contentType,
                        location: this.core.config.s3.bucket_url,
                        filepath: filepath
                    }
                    await this.fileDAO.insertFile(file)
                } else {
                    image = ''
                }
            } catch (error) {
                // On error cases, just null out the fileId and we'll fall
                // back.
                this.core.logger.error(error)
                fileId = null
            }
        }


    /*    The canonical URL is causing problems.  We're going to ignore it for now.
     *    Maybe we'll store it in a different attribute in the future.
     *
     *    let cannonicalUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || null
        if ( cannonicalUrl === null ) {
            cannonicalUrl = url
        }*/

        let siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || null
        if ( siteName === null ) {
            const urlObj = new URL(url)
            siteName = urlObj.hostname
        }

        let type = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') || null
        if ( type === null ) {
            type = 'website'
        }

        const linkPreview = {
            url: url,
            title: title,
            type: type,
            siteName: siteName,
            description: description,
            imageUrl: image, 
            fileId: fileId
        }

        return linkPreview
    }
}
