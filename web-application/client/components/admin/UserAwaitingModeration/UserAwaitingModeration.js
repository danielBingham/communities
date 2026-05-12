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

import { useUser } from '/lib/hooks/User'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import UserView from '/components/users/UserView'
import SiteModerationForm from '/components/admin/moderation/SiteModerationForm'

import Card from '/components/ui/Card'
import Button from '/components/ui/Button'

import './UserAwaitingModeration.css'

const UserAwaitingModeration = function({ siteModerationId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [moderation, siteModerationRequest, reloadSiteModeration] = useSiteModeration(siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const [user, userRequest, reloadUser] = useUser(moderation?.userProfileId)

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
            <div className="user-awaiting-moderation">
                <div className="user-awaiting-moderation__not-found">
                    <p>404 Moderation Not Found</p>
                    <Button type="warning" onClick={() => reloadSiteModeration()}>Retry</Button>
                </div>
            </div>
        )

    }

    if ( user === undefined || user === null ) {
        return (
            <div className="user-awaiting-moderation">
                <div className="user-awaiting-moderation__not-found">
                    <p>404 User Not Found</p>
                    <Button type="warning" onClick={() => reloadUser()}>Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <Card className="user-awaiting-moderation">
            <div className="user-awaiting-moderation__context">
                <a href={`/${user.username}`}>View Context</a>
            </div>
            <div className="user-awaiting-moderation__profile">
                <UserView id={moderation.userProfileId} />
            </div>
            <div className="user-awaiting-moderation__form">
                <SiteModerationForm siteModerationId={siteModerationId} />
            </div>
        </Card>
    )
}

export default UserAwaitingModeration
