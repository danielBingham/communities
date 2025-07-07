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

import { SitePermissions, useSitePermission } from './useSitePermission'
import { GroupPermissions, useGroupPermission } from './useGroupPermission'

export const GroupPostPermissions = {
    CREATE: 'create',
    VIEW: 'view'
}

export const useGroupPostPermission = function(currentUser, action, context) {
    if ( ! ('group' in context) || ! ( 'userMember' in context) ) {
        throw new Error('Missing context.')
    }

    context.canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    context.canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, context) 
    context.canAdminGroup = useGroupPermission(currentUser, GroupPermissions.ADMIN, context)

    if ( action === GroupPostPermissions.VIEW ) {
        return shared.permissions.GroupPost.canViewGroupPost(currentUser, context) 
    } else if ( action === GroupPostPermissions.CREATE ) {
        return shared.permissions.GroupPost.canCreateGroupPost(currentUser, context)
    } else {
        throw new Error(`Invalid GroupPostPermission: ${action}.`)
    }
}
