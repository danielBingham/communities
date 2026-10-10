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


/**
 * Keeps files in an S3 bucket.
 *
 * Configured by the `storage.s3` block:
 *
 *   storage: {
 *       driver: 's3',
 *       s3: {
 *           bucket_url: 'aws-ssm-parameter:/storage/s3/bucket-url',
 *           bucket: 'aws-ssm-parameter:/storage/s3/bucket',
 *           access_id: 'aws-ssm-parameter:/storage/s3/access-id',
 *           access_key: 'aws-ssm-parameter:/storage/s3/access-key'
 *       }
 *   }
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
 */
module.exports = class S3Storage {

    /**
     * @param {Core} core
     * @param {Object} settings The `storage.s3` block.
     * @param {Object} [client] An S3 client to use instead of constructing
     * one.
     */
    constructor(core, settings, client) {
        for (const key of [ 'bucket_url', 'bucket', 'access_id', 'access_key' ]) {
            if ( ! settings?.[key] ) {
                throw new Error(`The s3 storage driver needs storage.s3.${key} in the configuration.`)
            }
        }

        this.core = core
        this.bucket = settings.bucket
        this.region = settings.region || 'us-east-1'

        const clientFor = (endpoint) => new S3({
            region: this.region,
            credentials: {
                accessKeyId: settings.access_id,
                secretAccessKey: settings.access_key
            },
            ...( endpoint ? { endpoint: endpoint, forcePathStyle: true } : {} )
        })

        this.s3Client = client ?? clientFor(settings.endpoint)
        this.signingClient = settings.public_endpoint ? clientFor(settings.public_endpoint) : this.s3Client

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

    async getSignedUrl(path) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: path
            }

            const command = new GetObjectCommand(params)
            return await getSignedUrl(this.signingClient, command, { expiresIn: 60*60*24*7 })
        } catch (error) {
            this.core.logger.error(`Failed to getSignedUrl for '${path}': `, error)
            return null
        }
    }


    async removeFile(path) {
        const params = {
            Bucket: this.bucket,
            Key: path
        }

        await this.s3Client.send(new DeleteObjectCommand(params))
    }
}
