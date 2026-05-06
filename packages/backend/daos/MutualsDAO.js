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

module.exports = class MutualsDAO {

    constructor(core) {
        this.core = core
    }

    hydrateMutuals(rows) {
        const dictionary = { }

        if ( rows.length <= 0 ) {
            return { dictionary: dictionary }
        }

        for(const row of rows) {
            if ( ! ( row.current_id in dictionary )) {
                dictionary[row.current_id] = {} 
            }

            if ( ! ( row.target_id in dictionary[row.current_id] ) ) {
                dictionary[row.current_id][row.target_id] = []
            }

            dictionary[row.current_id][row.target_id].push(row.mutual_id)
        }

        return { dictionary: dictionary }
    }

    async selectMutuals(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        const params = query.params ? [ ...query.params ] : []

        const sql = `
            SELECT mutuals.current_id, mutuals.target_id, mutuals.mutual_id
                FROM mutuals
                ${where}
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {} }
        }

        return this.hydrateMutuals(results.rows)
    }
}

