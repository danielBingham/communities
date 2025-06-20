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

const Uuid = require('uuid')

const DAOError = require('../errors/DAOError')

module.exports = class DAO {
    // Valid settings for the `insert` property of a field.
    static INSERT = {
        PRIMARY: 'primary', // This field is a primary key.
        REQUIRE: 'required', // This field is required on insert.
        DENY: 'denied', // This field may not be inserted.
        ALLOW: 'allowed', // This field may optionally be inserted.
        OVERRIDE: 'override' // Override this field when inserting using `insertOverride`.
    }
    // Valid settings for the `update` property of a field.
    static UPDATE = {
        PRIMARY: 'primary', // This field is a primary key.
        REQUIRE: 'required', // This field is required when updating.
        DENY: 'denied', // This field may not be updated.
        ALLOW: 'allowed', // This field may optionally be updated.
        OVERRIDE: 'override' // Override this field when updating using `updateOverride`.
    }
    // Valid settings for the `select` property of a field.
    static SELECT = {
        ALWAYS: 'always', // Always select this field.
        REQUEST: 'request', // Only select this field when requested.
        NEVER: 'never', // Never select this field.  It is never read from the database.
        OVERRIDE: 'override' // Override this field when selecting.
    }

    constructor(core) {
        this.core = core

        this.entityMaps = {}
    }

    getSelectionString(entityName, requestedFields) {
        let string = ''
        const fields = requestedFields !== undefined && Array.isArray(requestedFields) ? requestedFields : []
        const selectAll = requestedFields === 'all'
        for(const [field, meta] of Object.entries(this.entityMaps[entityName].fields)) {
            if ( meta.needsFeature && ! this.core.features.has(meta.needsFeature)) {
                continue
            }

            if ( meta.select == DAO.SELECT.NEVER || meta.select == DAO.SELECT.OVERRIDE ) {
                continue
            }

            if ( meta.select == DAO.SELECT.REQUEST && ! fields.includes(field) && ! selectAll ) {
                continue
            }

            if ( string !== '' ) {
                string += ",\n"
            }
            string += `${this.entityMaps[entityName].table}.${field} as "${entityName}_${meta.key}"`
        }
        return string
    }

    hydrate(entityName, row) {
        const entity = {}
        for(const [field, meta] of Object.entries(this.entityMaps[entityName].fields)) {
            if ( meta.needsFeature && ! this.core.features.has(meta.needsFeature) ){
                entity[meta.key] = null
            } else if ( meta.select === DAO.SELECT.OVERRIDE ) {
                entity[meta.key] = meta.selectOverride()
            } else if ( row[`${entityName}_${meta.key}`] === undefined ) {
                entity[meta.key] = null
            } else {
                entity[meta.key] = row[`${entityName}_${meta.key}`]
            }
        }
        return entity
    }


    /**
     * @return Promise<void>
     */
    async insert(entityName, entities) {
        if ( ! Array.isArray(entities) ) {
            entities = [ entities ]
        }

        if ( entities.length <= 0 ) {
            return
        }

        let columns = '('
        for (const [field, meta] of Object.entries(this.entityMaps[entityName].fields)) {
            if ( meta.needsFeature && ! this.core.features.has(meta.needsFeature)) {
                continue
            }
            if ( meta.insert == 'denied' ) {
                continue
            }

            columns += ( columns == '(' ? '' : ', ') + field
        }

        if ( columns == '(' ) {
            throw new DAOError('missing-fields',
                `Empty field map sent to DAO::insert().`)
        }

        columns += ')'

        let rows = ''
        let params = []
        for(const entity of entities) {
            let row = '('
            for(const [field, meta] of Object.entries(this.entityMaps[entityName].fields)) {
                if ( meta.needsFeature && ! this.core.features.has(meta.needsFeature)) {
                    continue
                }

                if ( meta.insert == 'required' && ! ( meta.key in entity ) ) {
                    throw new DAOError('missing-field',
                        `Required '${meta.key}' not found in ${entityName}.`)
                }

                if ( meta.insert == 'denied' ) {
                    continue
                }

                // If they haven't included a primary key, generate one.
                // The database would generate one if it were left out, but 
                // it has the same effect as us generating one here and here we
                // can add it into the entity and we can have some entities include 
                // their own while others don't more easily.
                if ( meta.insert == 'primary' && ! ( meta.key in entity)) {
                    entity[meta.key] = Uuid.v4()
                }

                if ( meta.insert == 'override' ) {
                    row += ( row == '(' ? '' : ', ' ) + `${meta.insertOverride}`
                } else {
                    if ( ! (meta.key in entity) && ( 'insertDefault' in meta )) {
                        params.push(meta.insertDefault()) 
                    } else if ( ! (meta.key in entity) ) {
                        params.push(null)
                    } else { 
                        params.push(entity[meta.key])
                    }
                    row += ( row == '(' ? '' : ', ') + `$${params.length}`
                }
            }
            row += ')'

            if ( rows !== '' ) {
                rows += ', ' + row
            } else {
                rows += row
            }
        }

        let sql = `
            INSERT INTO ${this.entityMaps[entityName].table} ${columns}
                VALUES ${rows}
        `
        await this.core.database.query(sql, params)
    }

    async update(entityName, entity) {
        let fields = ''
        let where = ''
        let params = []

        const table = this.entityMaps[entityName].table

        // This is pure error checking.  If we don't have a primary key,
        // update's going to break or do weird shit.
        let foundPrimary = false 

        for(const [field, meta] of Object.entries(this.entityMaps[entityName].fields)) {
            if ( meta.needsFeature && ! this.core.features.has(meta.needsFeature)) {
                continue
            }

            // Primary keys go into the `where` statement.
            if ( meta.update == 'primary' && meta.key in entity ) {
                params.push(entity[meta.key])
                if ( where !== '' ) {
                    where += ' AND '
                }
                where += `${field} = $${params.length}`
                foundPrimary = true
                continue
            } else if ( meta.update == 'primary' ) {
                throw new DAOError('missing-field',
                    `Cannot update a row in ${table} without a primary key.`)
            }

            // If the key is missing and required, throw an error.  If it's not
            // required, then just continue on to the next key.
            if ( ! ( meta.key in entity ) && meta.update == 'required' ) {
                throw new DAOError('missing-field',
                    `Required '${meta.key}' not found in ${entityName}.`)
            } else if ( ! (meta.key in entity) && meta.key !== 'updatedDate' ) {
                continue
            }

            // If updating this key is disallowed, then just continue and
            // ignore it in the entity.
            if ( meta.update == 'denied' ) {
                continue
            }

            if ( meta.update == 'override' ) {
                fields += ( fields == '' ? '' : ', ') + `${field} = ${meta.updateOverride}`
            } else {
                params.push(( entity[meta.key] !== null ? entity[meta.key] : null ))
                fields += ( fields == '' ? '' : ', ') + `${field} = $${params.length}`
            }
        }

        if ( ! foundPrimary ) {
            throw new DAOError('missing-field',
                `Table ${table} has no primary key set for updates!`)
        }

        let sql = `
            UPDATE ${this.entityMaps[entityName].table}
                SET ${fields}
            WHERE ${where}`

        console.log(sql)
        await this.core.database.query(sql, params)
    }
}
