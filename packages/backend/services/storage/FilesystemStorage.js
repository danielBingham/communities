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
const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const { createReadStream, createWriteStream } = require('node:fs')
const path = require('node:path')
const { pipeline } = require('node:stream/promises')

// Signed links last as long as S3's: 7 days.
const SIGNED_URL_LIFETIME_SECONDS = 60*60*24*7

/**
 * Keeps files in a folder on disk, for local development.
 *
 * Configured by the `storage.filesystem` block:
 *
 *   storage: {
 *       driver: 'filesystem',
 *       filesystem: {
 *           directory: '../local-data/storage',
 *           secret: 'env:COMMUNITIES_STORAGE_FILESYSTEM_SECRET'
 *       }
 *   }
 *
 * Each key is a file under `directory`; a relative directory is relative to
 * the app's working directory. The web application and the worker must use
 * the same folder.
 *
 * Browsers load files the way they load them from S3, through signed links:
 * getSignedUrl() returns a link to FilesystemStorage.ROUTE on the app's host,
 * signed with `secret` and good for 7 days, and the web application serves
 * that route (see web-application/server/storage.js).
 */
module.exports = class FilesystemStorage {

    /**
     * Where the web application serves stored files.
     */
    static ROUTE = '/api/0.0.0/storage'

    /**
     * @param {Core} core   A core with `config.host`.
     * @param {Object} settings The `storage.filesystem` block.
     * @param {string} settings.directory   Where to keep files.
     * @param {string} settings.secret  The key links are signed with.
     */
    constructor(core, settings) {
        for (const key of [ 'directory', 'secret' ]) {
            if ( ! settings?.[key] ) {
                throw new Error(`The filesystem storage driver needs storage.filesystem.${key} in the configuration.`)
            }
        }

        this.directory = path.resolve(settings.directory)
        this.secret = settings.secret
        this.host = core.config.host

        /**
         * Recorded as `files.location` for each file stored here.
         */
        this.location = new URL(FilesystemStorage.ROUTE, this.host).href

        /**
         * Where browsers load stored files from, beyond the app's own origin:
         * nowhere, since the links point at the app.
         */
        this.contentOrigins = []
    }

    /**
     * The file a key is kept in.
     *
     * @throws {Error} When the key would be outside the storage folder.
     */
    pathFor(key) {
        const file = typeof key === 'string' && key !== '' ? path.resolve(this.directory, key) : null
        if ( file === null || ! file.startsWith(this.directory + path.sep) ) {
            throw new Error(`'${key}' isn't a valid storage key.`)
        }
        return file
    }

    /**
     * Write the file for `key` with `writeTo(file)`: first to a temporary name
     * beside it, then renamed into place, so nothing reads it half written.
     */
    async write(key, writeTo) {
        const file = this.pathFor(key)
        await fs.mkdir(path.dirname(file), { recursive: true })

        const partial = `${file}.${crypto.randomBytes(6).toString('hex')}.partial`
        try {
            await writeTo(partial)
            await fs.rename(partial, file)
        } catch (error) {
            await fs.rm(partial, { force: true })
            throw error
        }
    }

    async uploadFile(sourcePath, targetKey) {
        await this.write(targetKey, (file) => fs.copyFile(sourcePath, file))
    }

    async uploadFileFromStream(readStream, targetKey) {
        await this.write(targetKey, (file) => pipeline(readStream, createWriteStream(file)))
    }

    async copyFile(currentKey, newKey) {
        await this.write(newKey, (file) => fs.copyFile(this.pathFor(currentKey), file))
    }

    async moveFile(currentKey, newKey) {
        const file = this.pathFor(newKey)
        await fs.mkdir(path.dirname(file), { recursive: true })
        await fs.rename(this.pathFor(currentKey), file)
    }

    async hasFile(key) {
        try {
            const stats = await fs.stat(this.pathFor(key))
            return stats.isFile()
        } catch (error) {
            if ( error.code === 'ENOENT' ) {
                return false
            }
            throw error
        }
    }

    async getFile(key) {
        return await fs.readFile(this.pathFor(key))
    }

    async downloadFile(key, localPath) {
        await pipeline(createReadStream(this.pathFor(key)), createWriteStream(localPath))
    }

    /**
     * A link to the file that's good for 7 days.
     */
    async getSignedUrl(key) {
        const expires = Math.floor(Date.now() / 1000) + SIGNED_URL_LIFETIME_SECONDS
        const encodedKey = key.split('/').map(encodeURIComponent).join('/')

        const url = new URL(`${FilesystemStorage.ROUTE}/${encodedKey}`, this.host)
        url.searchParams.set('expires', expires)
        url.searchParams.set('signature', this.sign(key, expires))
        return url.href
    }

    /**
     * Whether a signed link's expiry and signature are valid for `key`.
     */
    verify(key, expires, signature) {
        if ( typeof key !== 'string' || typeof expires !== 'string' || typeof signature !== 'string' ) {
            return false
        }

        if ( ! /^[0-9]+$/.test(expires) || parseInt(expires, 10) * 1000 < Date.now() ) {
            return false
        }

        const expected = Buffer.from(this.sign(key, expires))
        const given = Buffer.from(signature)
        return given.length === expected.length && crypto.timingSafeEqual(given, expected)
    }

    sign(key, expires) {
        return crypto.createHmac('sha256', this.secret).update(`${key}\n${expires}`).digest('base64url')
    }

    async removeFile(key) {
        await fs.rm(this.pathFor(key), { force: true })
    }
}
