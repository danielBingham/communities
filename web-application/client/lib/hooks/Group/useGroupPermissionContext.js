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

import Requests from '/lib/request/Requests'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useFeature } from '/lib/hooks/feature'

export const useGroupPermissionContext = function(currentUser, groupId) {
    const context = {}
    const requests = new Requests() 

    const hasSubgroups = useFeature('issue-165-subgroups')

    const [group, groupRequest] = useGroup(groupId)

    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser?.id)

    const [parentGroup, parentGroupRequest] = useGroup(group?.parentId)
    const [parentMember, parentMemberRequest] = useGroupMember(group?.parentId, currentUser?.id)

    context.group = group
    context.userMember = currentMember

    if ( hasSubgroups ) {
        context.parentGroup = parentGroup
        context.parentMember = parentMember
    }

    requests.addRequest(groupRequest)
    requests.addRequest(currentMemberRequest)
    requests.addRequest(parentGroupRequest)
    requests.addRequest(parentMemberRequest)

    return [context, requests]
}
