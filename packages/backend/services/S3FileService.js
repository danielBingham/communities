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
const fs = require('fs')

const { S3 } = require('@aws-sdk/client-s3')
const { HeadObjectCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')


module.exports = class S3FileService {

    constructor(core) {
        this.core = core
        this.config = core.config

        const s3Config = {
            region: 'us-east-1',
            credentials: {
                accessKeyId: core.config.s3.access_id,
                secretAccessKey: core.config.s3.access_key
            }
        }

        this.s3Client = new S3(s3Config)
    }


    async uploadFile(sourcePath, targetPath) {
        return new Promise((resolve, reject) => {
            const filestream = fs.createReadStream(sourcePath)
            filestream.on('error', (error) => { reject(error) })
            filestream.on('ready', () => {
                const params = {
                    Bucket: this.config.s3.bucket,
                    Key: targetPath,
                    Body: filestream
                }

                this.s3Client.send(new PutObjectCommand(params)).then(() => resolve())
            })
        })
    }

    async uploadFileFromStream(readStream, targetPath) {
        const params = {
            Bucket: this.config.s3.bucket,
            Key: targetPath,
            Body: readStream 
        }

        await this.s3Client.send(new PutObjectCommand(params))
    }

    async copyFile(currentPath, newPath) {
        const params = {
            Bucket: this.config.s3.bucket,
            CopySource:this. config.s3.bucket + '/' + currentPath,
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
            Bucket: this.config.s3.bucket,
            Key: path
        }

        try {
            const response = await this.s3Client.send(new HeadObjectCommand(params))
            return response.$metadata.httpStatusCode === 200
        } catch (error ) {
            if ( error.$metadata?.httpStatusCode === 404 ) {
                return false
            } else if ( error.$metadata?.httpStatusCode === 403) {
                this.core.logger.error('Got 403 from S3.  Likely bad permissions.')
                this.core.logger.error(error)
                return false
            } else {
                throw error
            }
        }
    }

    async getFile(path) {
        const params = {
            Bucket: this.config.s3.bucket,
            Key: path
        }

        const response = await this.s3Client.send(new GetObjectCommand(params))
        return await response.Body.transformToByteArray()
    }

    async getSignedUrl(path) {
        const params = {
            Bucket: this.config.s3.bucket,
            Key: path
        }

        const command = new GetObjectCommand(params)
        return getSignedUrl(this.s3Client, command, { expiresIn: 60*60*24 })
    }


    async removeFile(path) {
        const params = {
            Bucket: this.config.s3.bucket,
            Key: path
        }

        await this.s3Client.send(new DeleteObjectCommand(params))
    }

    removeLocalFile(path) {
        fs.rmSync(path)
    }
}
