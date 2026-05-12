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
import can, {Actions, Entities} from '/lib/permission'

import { useGroup } from '/lib/hooks/Group'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import GroupProfile from '/components/groups/GroupProfile'
import SiteModerationForm from '/components/admin/moderation/SiteModerationForm'

import Card from '/components/ui/Card'
import Button from '/components/ui/Button'

import './GroupAwaitingModeration.css'

const GroupAwaitingModeration = function({ siteModerationId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [moderation, siteModerationRequest, reloadSiteModeration] = useSiteModeration(siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const [group, groupRequest, reloadGroup] = useGroup(moderation?.groupId)

    if ( canModerateSite !== true ) {
        return null
    }

    if ( siteModerationId === undefined || siteModerationId === null ) { 
        return null 
    }

    if ( ( moderation === undefined || moderation === null ) 
        && ( siteModerationRequest === null || siteModerationRequest?.state === 'pending') 
    ) {
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
        <Card className="group-awaiting-moderation">
            <div className="group-awaiting-moderation__context">
                <a href={`/group/${group.slug}`}>View Context</a>
            </div>
            <div className="group-awaiting-moderation__profile">
                <GroupProfile groupId={moderation.groupId} />
            </div>
            <div className="group-awaiting-moderation__form">
                <SiteModerationForm siteModerationId={siteModerationId} />
            </div>
        </Card>
    )
}

export default GroupAwaitingModeration
