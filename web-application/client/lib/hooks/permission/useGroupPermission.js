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

import * as shared from '@communities/shared'

import { SitePermissions, useSitePermission } from './useSitePermission'

export const GroupPermissions = {
    CREATE: 'create',
    VIEW: 'view',
    UPDATE: 'update',
    DELETE: 'delete',
    MODERATE: 'moderate',
    ADMIN: 'admin'
}

export const useGroupPermission = function(currentUser, action, context) {
    

    context.canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    // SiteModerators need to be able to view the group in order to moderate posts in it.
    if ( action === GroupPermissions.VIEW ) {
        return shared.permissions.Group.canViewGroup(currentUser, context) 
    } else if ( action === GroupPermissions.CREATE ) {
        return shared.permissions.Group.canCreateGroup(currentUser, context)
    } else if ( action === GroupPermissions.UPDATE ) {
        return shared.permissions.Group.canUpdateGroup(currentUser, context)
    } else if ( action === GroupPermissions.DELETE ) {
        return shared.permissions.Group.canDeleteGroup(currentUser, context)
    } else if ( action === GroupPermissions.MODERATE ) {
        return shared.permissions.Group.canModerateGroup(currentUser, context) 
    } else if ( action === GroupPermissions.ADMIN ) {
        return shared.permissions.Group.canAdminGroup(currentUser, context) 
    } else {
        throw new Error(`Invalid GroupPermission: ${action}.`)
    }
}
