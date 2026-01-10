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
const DAO = require('./DAO')
const DAOError = require('../errors/DAOError')

const SCHEMA = {
    'File': {
        table: 'files',
        fields: {
            'id': {
                insert: DAO.INSERT.PRIMARY,
                update: DAO.UPDATE.PRIMARY,
                select: DAO.SELECT.ALWAYS,
                key: 'id'
            },
            'user_id': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'userId'
            },
            'state': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'state',
                needsFeature: 'issue-67-video-uploads'
            },
            'job_id': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'jobId',
                needsFeature: 'issue-67-video-uploads'
            },
            'variants': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'variants',
                needsFeature: 'issue-67-video-uploads'
            },
            'kind': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'kind',
                needsFeature: 'issue-67-video-uploads'
            },
            'mimetype': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'mimetype',
                needsFeature: 'issue-67-video-uploads'
            },
            'type': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'type'
            },
            'thumb_id': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'thumbId'
            },
            'location': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'location'
            },
            'filepath': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'filepath'
            },
            'created_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.INSERT.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'createdDate'
            },
            'updated_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.INSERT.OVERRIDE,
                updateOverride: 'now()',
                select: DAO.SELECT.ALWAYS,
                key: 'updatedDate'
            }
        }
    }
}


module.exports = class FilesDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA

        this.database = core.database
        this.logger = core.logger
    }

    getFileSelectionString() {
        return this.getSelectionString('File')
    }

    hydrateFile(row) {
        return this.hydrate('File', row)
    }

    hydrateFiles(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            if ( ! ( row.File_id in dictionary) ) {
                dictionary[row.File_id] = this.hydrateFile(row)
                list.push(row.File_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getFileById(id) {
        const results = await this.selectFiles({
            where: 'files.id = $1',
            params: [ id ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        if ( ! ( id in results.dictionary ) ) {
            return null
        }

        return results.dictionary[id]
    }

    async selectFiles(query) {
        let where = query?.where ? `WHERE ${query.where}` : ''
        let params = query?.params ? [ ...query.params ] : []

        const sql = `
            SELECT 
                ${ this.getFileSelectionString() } 
                FROM files 
                ${where}
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return []
        }

        return this.hydrateFiles(results.rows)
    }

    async insertFile(files) {
        await this.insert('File', files)
    }

    async updateFile(file) {
        await this.update('File', file)
    }

    async deleteFile(file) {
        await this.database.query(`
            DELETE FROM files WHERE id = $1
        `, [ file.id ])
    }
}
