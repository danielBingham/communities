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

module.exports = class FileService {

    constructor(core) {
        this.core = core

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
            if ( this.core.features.has('issue-67-video-uploads') ) {
                segments.push(mime.getExtension(file.mimetype))
            } else {
                segments.push(mime.getExtension(file.type))
            }
        } else {
            segments.push(mime.getExtension(mimetype))
        }

        return segments.join('.')
    }

    getPath(file, variant, mimetype) {
        // For now all files live at the `files/` path.
        return path.join('files/', this.getFilename(file, variant, mimetype))
    }

    async deleteVariants(file) {
        if ( this.core.features.has('issue-67-video-uploads') ) {
            for(const variant of file.variants) {
                const filepath = this.getPath(file, variant) 
                const hasFile = await this.s3.hasFile(filepath)
                if ( hasFile ) {
                    this.s3.removeFile(filepath)
                }
            }
        } else {
            for(const size of this.defaultVariants) {
                const filepath = this.getPath(file, size) 
                const hasFile = await this.s3.hasFile(filepath)
                if ( hasFile ) {
                    this.s3.removeFile(filepath)
                }
            }
        }
    }

}
