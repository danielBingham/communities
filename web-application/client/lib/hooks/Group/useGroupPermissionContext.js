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
import { useGroup, useGroupQuery } from '/lib/hooks/Group'
import { useGroupMember, useGroupMemberQuery } from '/lib/hooks/GroupMember'
import { useFeature } from '/lib/hooks/feature'

export const useGroupPermissionContext = function(currentUser, groupId) {
    const context = {}

    const hasSubgroups = useFeature('issue-165-subgroups')

    const [group] = useGroup(groupId)
    const [currentMember] = useGroupMember(groupId, currentUser?.id)

    const [ancestorQuery] = useGroupQuery({ isAncestorOf: groupId }, ! hasSubgroups || ( group?.parentId === null || group?.parentId === undefined))
    const groupDictionary = useSelector((state) => state.Group.dictionary)

    const [ancestorMemberQuery] = useGroupMemberQuery(groupId, { isAncestorMemberFor: groupId }, ! hasSubgroups || (group?.parentId === null || group?.parentId === undefined))
    const groupMemberDictionary = useSelector((state) => state.GroupMember.dictionary)

    context.group = group
    context.userMember = currentMember

    context.ancestors = ancestorQuery ? ancestorQuery.list.map((id) => groupDictionary[id]) : []
    context.ancestorMembers = {}
    if ( ancestorMemberQuery ) {
        for(const id of ancestorMemberQuery.list) {
            const ancestorMember = groupMemberDictionary[id]
            context.ancestorMembers[ancestorMember.groupId] = ancestorMember
        }
    }

    return context
}
