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

const mime = require('mime')

const path = require('node:path')

const S3FileService = require('./files/S3FileService')

const FileDAO = require('../daos/FileDAO')

module.exports = class FileService {

    constructor(core) {
        this.core = core

        this.fileDAO = new FileDAO(core)

        this.s3 = new S3FileService(core)

        // Default variants
        this.defaultVariants = [ 30, 200, 325, 450, 650 ]
    }

    /**
     * Get the filename for a file, optional variant, and optional mimetype.
     *
     * @param {object} file     A File object.
     * @param {string} variant  (Optional) A variant name.
     * @param {string} mimetype (Optional) A mimetype.
     */
    getFilename(file, variant, mimetype) {
        // Filenames are of the format:
        //
        // <id>.[variant.]<extension>
        //
        // Eg. <uuid>.200.jpg OR <uuid>.jpg
        //
        let segments = []
        segments.push(file.id)

        // The 'full' variant is the root file path, skip this segment in that case.
        if ( variant !== undefined && variant !== null && variant !== 'full' ) {
            segments.push(variant)
        }

        if ( mimetype === undefined || mimetype === null ) {
            segments.push(mime.getExtension(file.mimetype))
        } else {
            segments.push(mime.getExtension(mimetype))
        }

        return segments.join('.')
    }

    getPath(file, variant, mimetype) {
        // For now all files live at the `files/` path.
        return path.join('files/', this.getFilename(file, variant, mimetype))
    }

    /**
     * A convenience wrapper around `areFilesInUse` for a single file.
     *
     * @param {uuid} fileId The File.id of the file we want to check.
     *
     * @return {boolean} True if the file is in use, false otherwise.
     */
    async isFileInUse(fileId) {
        return this.areFilesInUse([ fileId ])
    }

    /**
     * Determine whether any of the files identified by the ids in `fileIds`
     * are current in use anywhere.
     *
     * @param {uuid[]} fileIds An array of File.id for the files we wish to check.
     *
     * @return {boolean} True if any of the files are in use, false otherwise.
     */
    async areFilesInUse(fileIds) {
        // Ensure the files they are attaching are not in use already.
        const usageResults = await this.core.database.query(`
            SELECT
                post_files.post_id as "postId", users.id as "userId", groups.id as "groupId", link_previews.id as "linkPreviewId"
            FROM files
                LEFT OUTER JOIN post_files ON files.id = post_files.file_id
                LEFT OUTER JOIN users ON files.id = users.file_id
                LEFT OUTER JOIN groups ON files.id = groups.file_id
                LEFT OUTER JOIN link_previews ON files.id = link_previews.file_id
            WHERE
                files.id = ANY($1::uuid[]) AND (
                    post_files.post_id IS NOT NULL
                    OR users.id IS NOT NULL
                    OR groups.id IS NOT NULL
                    OR link_previews.id IS NOT NULL
                )
        `, [ fileIds ])

        if ( usageResults.rows.length === 0 ) {
            return false
        }

        return true
    }

    async getUsageByFileId(fileId) {
        const usageDictionary = await this.getUsageByFileIds([ fileId ])

        if ( ! ( fileId in usageDictionary ) ) {
            return null
        }

        return usageDictionary[fileId]
    }

    async getUsageByFileIds(fileIds) {
        const usageDictionary = {}

        // Ensure the files they are attaching are not in use already.
        const usageResults = await this.core.database.query(`
            SELECT
                files.id,
                post_files.post_id as "postId",
                users.id as "userId",
                groups.id as "groupId",
                link_previews.id as "linkPreviewId"
            FROM files
                LEFT OUTER JOIN post_files ON files.id = post_files.file_id
                LEFT OUTER JOIN users ON files.id = users.file_id
                LEFT OUTER JOIN groups ON files.id = groups.file_id
                LEFT OUTER JOIN link_previews ON files.id = link_previews.file_id
            WHERE
                files.id = ANY($1::uuid[]) AND (
                    post_files.post_id IS NOT NULL
                    OR users.id IS NOT NULL
                    OR groups.id IS NOT NULL
                    OR link_previews.id IS NOT NULL
                )
        `, [ fileIds ])

        for(const row of usageResults.rows) {
            if ( row.id in usageDictionary ) {
                // We're going to allow the last row to win, but log the
                // invalid usage so that we can (potentially) manually clean it
                // up later.
                this.core.logger.error(`File(${row.id}) used in multiple places!`)
            }


            usageDictionary[row.id] = row
        }

        return usageDictionary
    }

    async deleteFileById(fileId) {
        const existing = await this.fileDAO.getFileById(fileId)
        if ( existing === null || existing === undefined ) {
            return null
        }

        await this.deleteFile(existing)
    }

    async deleteFile(file) {
        // TODO If the file has a processing job in progress, we don't actually
        // have the ability to cancel it.  So it's possible that job will be
        // creating a variant while we're in the process of deleting them.
        // There's a case in the race condition where the variant doesn't get
        // deleted and is left hanging.
        //
        // At some point we're going to need a weekly orphan file cleanup job
        // for our S3, but for now, storage is cheap, we're going to let them
        // hang.

        if ( 'variants' in file && Array.isArray(file.variants) ) {
            await this.deleteVariants(file)
        }

        if ( file.filepath !== null && file.filepath !== undefined ) {
            await this.s3.removeFile(file.filepath)
        } else {
            this.core.logger.warn(`Removing File(${file.id}) without a filepath.`)
        }

        // Database constraints should handle any cascading here.
        await this.fileDAO.deleteFile(file.id)
    }

    async deleteVariants(file) {
        for(const variant of file.variants) {
            const filepath = this.getPath(file, variant)
            const hasFile = await this.s3.hasFile(filepath)
            if ( hasFile ) {
                this.s3.removeFile(filepath)
            }
        }
    }

}
