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
const fs = require('node:fs')
const { once } = require('node:events')

const { S3 } = require('@aws-sdk/client-s3')
const { HeadObjectCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const { chooseAWSCredentials } = require('../../lib/aws-credentials')
const { linkLifetimeSetting } = require('./links')

/**
 * The least time a link signed with expiring credentials should have left.
 * Before signing, S3Storage asks for new credentials when its own have less
 * than this (plus LINK_EXPIRY_MARGIN_SECONDS) left. See getSignedLink().
 */
const MIN_CREDENTIAL_LIFETIME_SECONDS = 60*60

/**
 * How long before its credentials expire a link signed with them is made to
 * expire, so the link says it expires no later than it really stops working.
 */
const LINK_EXPIRY_MARGIN_SECONDS = 60


/**
 * Keeps files in an S3 bucket.
 *
 * Configured by the `storage.s3` block:
 *
 *   storage: {
 *       driver: 's3',
 *       s3: {
 *           bucket_url: 'aws-ssm-parameter:/storage/s3/bucket-url',
 *           bucket: 'aws-ssm-parameter:/storage/s3/bucket'
 *       }
 *   }
 *
 * It reaches S3 with the same AWS credentials the app reads Parameter Store
 * with (chooseAWSCredentials() in lib/aws-credentials.js): the access keys
 * in AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY locally, the pod's EKS Pod
 * Identity on staging and production. So each environment uses one identity
 * for both.
 *
 * A block can have keys of its own instead, which override those when both
 * are set:
 *
 *   access_id         The access key ID.
 *   access_key        The secret access key.
 *
 * An S3-compatible server's key goes here. Staging's and production's
 * configurations also have them, from `/<env>/storage/s3/access-id` and
 * `access-key`, until runbooks/feat-15-no-access-keys-for-s3 (in the
 * infrastructure repository) moves each to its pods' role.
 *
 * Optionally:
 *
 *   link_lifetime     How many seconds signed links last, at most. Defaults
 *                     to 7 days, S3's limit (see links.js). Links signed with
 *                     Pod Identity's credentials last only as long as those
 *                     do, from 1 to 6 hours (see getSignedLink()).
 *
 * For an S3-compatible server instead of AWS, also set:
 *
 *   endpoint          The server's S3 API, e.g. 'http://localhost:3900'.
 *                     Buckets are then addressed by path, which these servers
 *                     expect.
 *   public_endpoint   (Optional) The same API as browsers reach it, when that
 *                     differs from `endpoint` (e.g. `endpoint` is a container
 *                     hostname). Signed links are made with it.
 *   region            (Optional) Defaults to 'us-east-1'.
 *
 * The permissions it needs are the ones the S3 policies in the
 * infrastructure repository's terraform/aws/shared/iam give
 * (`s3-<environment>-access`): GetObject, PutObject, DeleteObject and
 * ListBucket. A release that makes another kind of S3 call needs it added to
 * those first.
 */
module.exports = class S3Storage {

    /**
     * Check the `storage.s3` block.
     *
     * @param {Object} settings The `storage.s3` block.
     *
     * @throws {Error} When a required setting is missing, only one of the
     * keys is set, or `link_lifetime` isn't valid.
     */
    static validateConfig(settings) {
        for (const key of [ 'bucket_url', 'bucket' ]) {
            if ( ! settings?.[key] ) {
                throw new Error(`The s3 storage driver needs storage.s3.${key} in the configuration.`)
            }
        }

        if ( Boolean(settings.access_id) !== Boolean(settings.access_key) ) {
            throw new Error(`The s3 storage driver needs both storage.s3.access_id and storage.s3.access_key, `
                + `or neither to use the same AWS credentials as Parameter Store.`)
        }

        linkLifetimeSetting(settings.link_lifetime, 'storage.s3')
    }

    /**
     * @param {Core} core
     * @param {Object} settings The `storage.s3` block.
     * @param {Object} [client] An S3 client to use instead of constructing
     * one.
     * @param {Object} [env]    The environment the credentials are chosen
     * from. Defaults to `process.env`.
     *
     * @throws {ConfigError} When there are no keys and no Pod Identity (see
     * chooseAWSCredentials()).
     */
    constructor(core, settings, client, env) {
        S3Storage.validateConfig(settings, core.config?.environment)

        this.core = core
        this.bucket = settings.bucket
        this.region = settings.region || 'us-east-1'
        this.linkLifetime = linkLifetimeSetting(settings.link_lifetime, 'storage.s3')

        // The block's own keys when it has them (see above), otherwise the
        // ones Parameter Store is read with.
        const { source, credentials } = settings.access_id && settings.access_key
            ? {
                source: 'the access keys in storage.s3.access_id and storage.s3.access_key',
                credentials: { accessKeyId: settings.access_id, secretAccessKey: settings.access_key }
            }
            : chooseAWSCredentials(env ?? process.env, 'use S3')
        core.logger.info(`Using S3 with ${source}.`)

        // A refresh of the signing client's credentials in progress, so links
        // signed at the same time share it (see signingCredentials()).
        this.credentialRefresh = null

        // If client is defined, just use that client.
        if ( client ) {
            this.s3Client = client
        }
        // Otherwise, create a new S3 client using the configuration settings.
        else {
            const clientConfig = {
                region: this.region,
                credentials: credentials
            }

            // If endpoint is set, it means we're using an S3 compatible API.
            // Pass it to the client.
            if ( 'endpoint' in settings && settings.endpoint ) {
                clientConfig.endpoint = settings.endpoint
                clientConfig.forcePathStyle = true // This is an undocumented API that prevents the client from adding the bucket to the origin.
            }
            this.s3Client = new S3(clientConfig)
        }

        // If `public_endpoint` is set, it means the endpoint used to read file
        // is different from the one used to interact with the API.  This
        // should only be true for S3 compatible alternatives.
        if ( 'public_endpoint' in settings && settings.public_endpoint ) {
            const signingClientConfig = {
                region: this.region,
                credentials: credentials,
                endpoint: settings.public_endpoint,
                forcePathStyle: true // An undocumented API that prevents the client from adding the bucket to the origin.
            }
            this.signingClient = new S3(signingClientConfig)
        }
        // If we don't have `public_endpoint` set, just use the root client.
        else {
            this.signingClient = this.s3Client
        }

        /**
         * Recorded as `files.location` for each file stored here.
         */
        this.location = settings.bucket_url

        /**
         * Where browsers load stored files from, for the Content Security
         * Policy: the bucket's URL, and the host the signed links point at.
         */
        this.contentOrigins = [
            settings.bucket_url,
            settings.public_endpoint || settings.endpoint || `https://${this.bucket}.s3.${this.region}.amazonaws.com`
        ]
    }


    async uploadFile(sourcePath, targetPath) {
        return new Promise((resolve, reject) => {
            const filestream = fs.createReadStream(sourcePath)
            filestream.on('error', (error) => { reject(error) })
            filestream.on('ready', () => {
                const params = {
                    Bucket: this.bucket,
                    Key: targetPath,
                    Body: filestream
                }

                this.s3Client.send(new PutObjectCommand(params)).then(() => resolve()).catch((error) => reject(error))
            })
        })
    }

    async uploadFileFromStream(readStream, targetPath) {
        const params = {
            Bucket: this.bucket,
            Key: targetPath,
            Body: readStream
        }

        await this.s3Client.send(new PutObjectCommand(params))
    }

    /**
     * Write `data` to `targetPath`, replacing anything already there.
     *
     * For contents we already hold in memory, like a JSON document.  The S3
     * API needs to know a body's length up front, which a Buffer gives it and
     * an arbitrary stream doesn't.
     *
     * @param {Buffer|Uint8Array|string} data   The file's contents.
     * @param {string} targetPath   The key to write.
     * @param {string} [contentType]    The file's MIME type, if known.
     */
    async uploadFileFromBuffer(data, targetPath, contentType) {
        const params = {
            Bucket: this.bucket,
            Key: targetPath,
            Body: data
        }

        if ( contentType ) {
            params.ContentType = contentType
        }

        await this.s3Client.send(new PutObjectCommand(params))
    }

    async copyFile(currentPath, newPath) {
        const params = {
            Bucket: this.bucket,
            CopySource: this.bucket + '/' + currentPath,
            Key: newPath
        }

        await this.s3Client.send(new CopyObjectCommand(params))
    }

    async moveFile(currentPath, newPath) {
        await this.copyFile(currentPath, newPath)
        await this.removeFile(currentPath)
    }

    async hasFile(path) {
        const params = {
            Bucket: this.bucket,
            Key: path
        }

        try {
            const response = await this.s3Client.send(new HeadObjectCommand(params))
            return response.$metadata.httpStatusCode === 200
        } catch (error ) {
            if ( error.$metadata?.httpStatusCode === 404 ) {
                return false
            } else if ( error.$metadata?.httpStatusCode === 403) {
                this.core.logger.error(`403 - Bad Permissions Suspected.\n  \tBucket: ${params.Bucket}\n \tKey: ${path}`)
                this.core.logger.error(error)
                return false
            } else {
                throw error
            }
        }
    }

    async getFile(path) {
        const params = {
            Bucket: this.bucket,
            Key: path
        }

        const response = await this.s3Client.send(new GetObjectCommand(params))
        return await response.Body.transformToByteArray()
    }

    async downloadFile(path, localPath) {
        const params = {
            Bucket: this.bucket,
            Key: path
        }

        const response = await this.s3Client.send(new GetObjectCommand(params))
        const stream = response.Body.pipe(fs.createWriteStream(localPath))
        await once(stream, 'finish')
    }

    /**
     * A signed link to the file, and how long it lasts.
     *
     * A link lasts `link_lifetime` (7 days unless set), unless the
     * credentials it's signed with expire sooner: S3 stops accepting a link
     * when its credentials expire, whatever the link says. Access keys don't
     * expire. Pod Identity's credentials last 6 hours, and the agent on the
     * node renews them every 3 hours, but the SDK keeps using a set until 5
     * minutes before it expires. So before signing, the credentials are
     * renewed when they have less than an hour left (signingCredentials()),
     * and each link is made to expire a minute before them: from 1 to 6
     * hours.
     *
     * @param {string} path The file's key.
     *
     * @return {Promise<Object|null>} `{ url, lifetime }`: the link, and how
     * many seconds it lasts from now. Null when it couldn't be signed, which
     * is logged.
     */
    async getSignedLink(path) {
        try {
            let lifetime = this.linkLifetime

            const credentials = await this.signingCredentials()
            if ( credentials?.expiration instanceof Date ) {
                const left = Math.floor((credentials.expiration.getTime() - Date.now()) / 1000)
                lifetime = Math.max(1, Math.min(lifetime, left - LINK_EXPIRY_MARGIN_SECONDS))
            }

            const params = {
                Bucket: this.bucket,
                Key: path
            }

            const command = new GetObjectCommand(params)
            const url = await getSignedUrl(this.signingClient, command, { expiresIn: lifetime })
            return { url: url, lifetime: lifetime }
        } catch (error) {
            this.core.logger.error(`Failed to getSignedUrl for '${path}': `, error)
            return null
        }
    }

    /**
     * A signed link to the file, without how long it lasts. For a redirect,
     * which the browser follows straight away.
     *
     * @return {Promise<string|null>} The link, or null when it couldn't be
     * signed.
     */
    async getSignedUrl(path) {
        return (await this.getSignedLink(path))?.url ?? null
    }

    /**
     * The credentials links are signed with: the signing client's, renewed
     * first when they expire within MIN_CREDENTIAL_LIFETIME_SECONDS (plus the
     * margin each link keeps). Renewing asks the Pod Identity agent again,
     * which hands out credentials it renewed within the last 3 hours, so with
     * 3 to 6 hours left. Links signed while a renewal is under way wait for
     * it rather than starting their own.
     *
     * @return {Promise<Object|undefined>} The credentials, or undefined when
     * the client can't say (a client given to the constructor).
     */
    async signingCredentials() {
        const provider = this.signingClient?.config?.credentials
        if ( typeof provider !== 'function' ) {
            return undefined
        }

        const credentials = await provider()
        if ( ! ( credentials?.expiration instanceof Date ) ) {
            return credentials
        }

        const needed = (MIN_CREDENTIAL_LIFETIME_SECONDS + LINK_EXPIRY_MARGIN_SECONDS) * 1000
        if ( credentials.expiration.getTime() - Date.now() >= needed ) {
            return credentials
        }

        if ( this.credentialRefresh === null ) {
            this.credentialRefresh = Promise.resolve(provider({ forceRefresh: true }))
                .finally(() => { this.credentialRefresh = null })
        }
        const renewed = await this.credentialRefresh

        if ( renewed?.expiration instanceof Date && renewed.expiration.getTime() - Date.now() < needed ) {
            this.core.logger.warn(`S3's credentials expire at ${renewed.expiration.toISOString()}, even after `
                + `asking for new ones, so links signed with them last less than an hour. `
                + `Check the EKS Pod Identity agent on this node.`)
        }

        return renewed
    }


    async removeFile(path) {
        const params = {
            Bucket: this.bucket,
            Key: path
        }

        await this.s3Client.send(new DeleteObjectCommand(params))
    }
}
