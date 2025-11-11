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

const GroupDAO = require('../daos/GroupDAO')

const ServiceError = require('../errors/ServiceError')

module.exports = class GroupService {
    
    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
    }

    async getParentIds(groupId) {
        const results = await this.core.database.query(`
            WITH RECURSIVE parents(id, title, parent_id, path) AS ( 
                    SELECT groups.id, groups.title, groups.parent_id, ARRAY[groups.id] 
                        FROM groups 
                UNION ALL 
                    SELECT groups.id, groups.title, groups.parent_id, parents.path || groups.id 
                        FROM groups, parents WHERE groups.id = parents.parent_id 
            ) 
            SELECT id, path FROM parents WHERE $1 = path[0] AND parents.parent_id IS NULL;
        `, [ groupId ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        if ( results.rows.length > 1 ) {
            throw new ServiceError('invalid', 'Group has more than one root parent!')
        }

        const parentIds = results.rows[0].path.filter((gid) => gid !== groupId)

        return parentIds 
    }

}
