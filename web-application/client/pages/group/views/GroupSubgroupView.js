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
import { useSelector } from 'react-redux'
import { PlusIcon } from '@heroicons/react/24/solid'

import can, { Actions, Entities } from '/lib/permission'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import GroupList from '/components/groups/GroupList'

import Button from '/components/ui/Button'

import './GroupSubgroupView.css'

const GroupSubgroupView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [ context, requests] = useGroupPermissionContext(currentUser, groupId)

    const canCreateGroup = can(currentUser, Actions.create, Entities.Group, context)

    return (
        <div className="group-subgroup-view">
            <div className="group-subgroup-view__controls">
                { canCreateGroup && <Button type="primary" href={`/groups/create?parentId=${groupId}`}><PlusIcon /> Create Subgroup</Button> }
            </div>
            <GroupList params={{ isChildOf: groupId }} />
        </div>
    )
}

export default GroupSubgroupView
