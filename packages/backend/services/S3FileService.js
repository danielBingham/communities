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
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')


module.exports = class S3FileService {

    constructor(core) {
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
        const filestream = fs.createReadStream(sourcePath)

        const params = {
            Bucket: this.config.s3.bucket,
            Key: targetPath,
            Body: filestream
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
