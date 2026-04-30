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

import { useGroup } from '/lib/hooks/Group'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import GroupBadge from '/components/groups/view/GroupBadge'

import Button from '/components/ui/Button'

const GroupAwaitingModeration = function({ siteModerationId }) {

    const [moderation, siteModerationRequest, reloadSiteModeration] = useSiteModeration(siteModerationId)
    console.log(`moderation: `, moderation)
    const [group, groupRequest, reloadGroup] = useGroup(moderation?.groupId)
    console.log(`group: `, group)

    if ( siteModerationId === undefined || siteModerationId === null ) { 
        return null 
    }

    if ( moderation === undefined || moderation === null ) {
        return (
            <div className="group-awaiting-moderation">
                <div className="group-awaiting-moderation__not-found">
                    <p>404 Moderation Not Found</p>
                    <Button type="warning" onClick={() => reloadSiteModeration()}>Retry</Button>
                </div>
            </div>
        )

    }

    if ( group === undefined || group === null ) {
        return (
            <div className="group-awaiting-moderation">
                <div className="group-awaiting-moderation__not-found">
                    <p>404 Group Not Found</p>
                    <Button type="warning" onClick={() => reloadGroup()}>Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="group-awaiting-moderation">
            <GroupBadge id={moderation.groupId} />
        </div>
    )
}

export default GroupAwaitingModeration
