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

const BaseMigration = require('./BaseMigration')

const FileDAO = require('../daos/FileDAO')
const S3FileService = require('../services/files/S3FileService')

module.exports = class Issue67VideoUploadsMigration extends BaseMigration {

    constructor(core) {
        super(core)

        this.fileDAO = new FileDAO(core)
        this.fileService = new S3FileService(core)
    }

    async initForward() {
        await this.core.database.query(`CREATE TYPE file_state as ENUM('pending', 'processing', 'error', 'ready')`, [])
        await this.core.database.query(`CREATE TYPE supported_file_types as ENUM('image', 'video')`, [])

        await this.core.database.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS state file_state DEFAULT 'pending'`, [])
        await this.core.database.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS job_id uuid DEFAULT NULL`, [])
        await this.core.database.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS variants text[]`, [])

        await this.core.database.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS kind supported_file_types`, [])
        await this.core.database.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS mimetype text`, [])
    }

    async initBack() { 
        await this.core.database.query(`ALTER TABLE files DROP COLUMN IF EXISTS state`, [])
        await this.core.database.query(`ALTER TABLE files DROP COLUMN IF EXISTS job_id`, [])
        await this.core.database.query(`ALTER TABLE files DROP COLUMN IF EXISTS variants`, [])

        await this.core.database.query(`ALTER TABLE files DROP COLUMN IF EXISTS kind`, [])
        await this.core.database.query(`ALTER TABLE files DROP COLUMN IF EXISTS mimetype`, [])

        await this.core.database.query(`DROP TYPE IF EXISTS supported_file_types`, [])
        await this.core.database.query(`DROP TYPE IF EXISTS file_state`, [])

    }

    async migrateForward(targets) { 
        this.core.logger.info(`Beginning migration for 'issue-67-video-uploads'...`)
        const results = await this.fileDAO.selectFiles()

        for(const fileId of results.list) {
            const file = results.dictionary[fileId]
            this.core.logger.info(`Processing file: `, file.id)

            const isPreview = file.filepath.split('/')[0] === 'previews'
            if ( isPreview === true ) {
                this.core.logger.info(`File(${file.id}) is a preview: ${file.filepath}.  Continuing...`)
                continue
            }

            const kind = file.type.split('/')[0]
            if ( kind !== 'video' && kind !== 'image' ) {
                this.core.logger.info(`File(${file.id}) is  a '${kind}', neither video nor image, we're going to igore it for now...`)
                continue
            }

            const variants = []
            if ( kind === 'image' ) {
                const imageSizes = [ 30, 200, 325, 450, 650 ] 
                for(const size of imageSizes) {
                    const fileName = `${file.id}.${size}.${mime.getExtension(file.type)}`
                    const path = `files/${fileName}`
                    this.core.logger.info(`Checking for variant: `, path)
                    const hasFile = await this.fileService.hasFile(path)
                    if ( hasFile === true ) {
                        this.core.logger.info(`Variant found.`)
                        variants.push(size)
                    }
                }
            }

            const filePatch = {
                id: file.id,
                state: 'ready',
                kind: kind,
                mimetype: file.type,
                variants: variants
            }

            this.core.logger.info(`Processing file: `, file,
                `\nWith patch: `, filePatch)
            await this.core.database.query(`
                UPDATE files SET state='ready', kind=$2, mimetype=$3, variants=$4 WHERE id=$1
            `, [ file.id, kind, file.type, variants ])
        }
    }

    async migrateBack(targets) { }
}
