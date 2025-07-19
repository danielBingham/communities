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
module.exports = class FeatureDAO {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config
    }

    getFeatureSelectionString() {
        return `
            features.name as feature_name, features.status as feature_status, 
            features.created_date as "feature_createdDate", features.updated_date as "feature_updatedDate"
        `
    }

    hydrateFeature(row) {
        return {
            name: row.feature_name,
            status: row.feature_status,
            createdDate: row.feature_createdDate,
            updatedDate: row.feature_updatedDate
        }
    }

    hydrateFeatures(rows) {
        const dictionary = {}
        const list = []

        if ( rows.length <= 0 ) {
            return { list: list, dictionary: dictionary }
        }

        for(const row of rows) {
            const feature = this.hydrateFeature(row)

            if ( ! dictionary[feature.name] ) {
                dictionary[feature.name] = feature
                list.push(feature)
            }
        }
        return { list: list, dictionary: dictionary }
    }

    async selectFeatures(where, params) {
        where = where ? where : ''
        params = params ? params : []

        const sql = `
            SELECT
                ${this.getFeatureSelectionString()}
            FROM features
            ${where}
            ORDER BY features.created_date DESC
        `

        const results = await this.database.query(sql, params)

        return this.hydrateFeatures(results.rows)
    }

    async insertFeature(feature) {
        const sql = `
            INSERT INTO features (name, created_date, updated_date)
                VALUES ($1, now(), now())
        `

        const result = await this.database.query(sql, [ feature.name ])
        
        if ( result.rowCount <= 0 ) {
            throw new DAOError('insert-failed', `Failed to insert Feature(${feature.name}).`)
        }
    }

    async updatePartialFeature(feature) {
        // We'll ignore these fields when assembling the patch SQL.  These are
        // fields that either need more processing (authors) or that we let the
        // database handle (date fields, id, etc)
        const ignoredFields = [ 'name', 'createdDate', 'updatedDate' ]

        let sql = 'UPDATE features SET '
        let params = []
        let count = 1
        for(let key in feature) {
            if (ignoredFields.includes(key)) {
                continue
            }

            sql += key + ' = $' + count + ', '

            params.push(feature[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE name = $' + count

        params.push(feature.name)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0 ) {
            throw new DAOError('update-failure', `Failed to update Feature(${feature.name}) with partial update.`) 
        }
    }

}
