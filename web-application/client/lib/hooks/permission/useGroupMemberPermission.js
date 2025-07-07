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
import * as shared from '@communities/shared'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { SitePermissions, useSitePermission } from './useSitePermission'
import { GroupPermissions, useGroupPermission } from './useGroupPermission'


export const GroupMemberPermissions = {
    QUERY: 'query',
    CREATE: 'create',
    VIEW: 'view',
    UPDATE: 'update',
    DELETE: 'delete'
}

export const useGroupMemberPermission = function(currentUser, action, context) {
    if ( ! ('group' in context) || ! ( 'userMember' in context) ) {
        throw new Error('Missing context.')
    }

    context.canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    context.canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, context) 
    context.canAdminGroup = useGroupPermission(currentUser, GroupPermissions.ADMIN, context)

    // SiteModerators need to be able to view the group in order to moderate posts in it.
    if ( action === GroupMemberPermissions.QUERY ) {
        return shared.permissions.GroupMember.canQueryGroupMember(currentUser, context)
    } else if ( action === GroupMemberPermissions.VIEW ) {
        return shared.permissions.GroupMember.canViewGroupMember(currentUser, context) 
    } else if ( action === GroupMemberPermissions.CREATE ) {
        return shared.permissions.GroupMember.canCreateGroupMember(currentUser, context)
    } else if ( action === GroupMemberPermissions.UPDATE ) {
        return shared.permissions.GroupMember.canUpdateGroupMember(currentUser, context)
    } else if ( action === GroupMemberPermissions.DELETE ) {
        return shared.permissions.GroupMember.canDeleteGroupMember(currentUser, context)
    } else {
        throw new Error(`Invalid GroupMemberPermission: ${action}.`)
    }
}
