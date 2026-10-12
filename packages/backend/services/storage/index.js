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
const FilesystemStorage = require('./FilesystemStorage')
const S3Storage = require('./S3Storage')

/**
 * Create the storage driver the configuration selects.
 *
 * `storage.driver` names the driver, and the block with the same name holds
 * that driver's settings; blocks for other drivers aren't used.
 *
 *   storage: {
 *       driver: 's3',
 *       s3: { bucket: 'aws-ssm-parameter:/storage/s3/bucket', ... }
 *   }
 *
 * Every driver has the same methods: uploadFile, uploadFileFromStream,
 * copyFile, moveFile, hasFile, getFile, downloadFile, getSignedUrl and
 * removeFile, plus `location` (recorded with each file) and `contentOrigins`
 * (where browsers load files from).
 *
 * @param {Core} core   A core with `config` and `logger`.
 *
 * @return {S3Storage|FilesystemStorage}
 *
 * @throws {Error} When `storage.driver` isn't a known driver, or the driver's
 * settings are incomplete.
 */
const createStorage = function(core) {
    const driver = core.config.storage?.driver

    if ( driver === 's3' ) {
        return new S3Storage(core, core.config.storage.s3)
    } else if ( driver === 'filesystem' ) {
        if ( core.config.environment === 'development' ) {
            return new FilesystemStorage(core, core.config.storage.filesystem)
        } else {
            throw new Error('The filesystem storage driver may only be used in development.')
        }
    } else {
        throw new Error(`storage.driver in the configuration must be one of 's3' or 'filesystem', `
            + `but it's '${driver ?? ''}'.`)
    }
}

module.exports = {
    FilesystemStorage: FilesystemStorage,
    S3Storage: S3Storage,
    createStorage: createStorage
}
