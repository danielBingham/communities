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

const { preview, presets} = require('linkpeek')

const FileDAO = require('../daos/FileDAO')

const LocalFileService = require('./files/LocalFileService')
const S3FileService = require('./files/S3FileService')

const { ssrfSafeFetch } = require('../lib/ssrf-safe-fetch')

module.exports = class LinkPreviewService {
    constructor(core) {
        this.core = core

        this.fileDAO = new FileDAO(core)

        this.s3 = new S3FileService(core)
        this.local = new LocalFileService(core)
    }

    async getPreview(url) {
        let rootUrl = null
        try {
            rootUrl = new URL(url)
        } catch (error) {
            throw new ServiceError('invalid-url', `Failed to parse the provided url.`)
        }

        if ( rootUrl === null ) {
            throw new ServiceError('invalid-url', `Failed to parse the provided url.`)
        }

        try {
            const result = await preview(rootUrl, {
                ...presets.quality,
                userAgent: 'CommunitiesBot-LinkExpanding 1.0 (+https://communities.social)',
                fetch: ssrfSafeFetch }
            )

            if ( result.statusCode >= 400 ) {
                this.core.logger.info(`LinkPreviewService:: Failed to retrieve ${rootUrl.href}.`)
                if ( result.statusCode=== 404 ) {
                    throw new ServiceError('not-found', `Didn't find a site for link: ${rootUrl.href}`)
                } else if ( result.statusCode=== 403 ) {
                    throw new ServiceError('not-authorized', `Site denied our attempt to scrape: ${rootUrl.href}`)
                } else {
                    throw new ServiceError('request-failed', `Attempt to retrieve LinkPreview(${rootUrl.href}) failed with status: ${result.statusCode}`)
                }
            }

            const linkPreview = {
                url: url,
                title: result.title ?? '',
                type: result.mediaType ?? '',
                siteName: result.siteName ?? '',
                description: result.description ?? '',
                imageUrl: result.image ?? '',
                fileId: null
            }

            return linkPreview
        } catch (error) {
            this.core.logger.error(`Failed retrieve link preview with error: `, error)
            if ( error instanceof ServiceError ) {
                throw error
            } else {
                throw new ServiceError('request-failed', `Attempt to retrieve LinkPreview for ${rootUrl.href} failed.`)
            }
        }
    }
}
