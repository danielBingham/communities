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

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import Toggle from '/components/generic/toggle/Toggle'
import { RequestErrorModal } from '/components/errors/RequestError'

import './UserAccountPreferencesView.css'

const UserAccountPreferencesView = function() {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const setSetting = function(setting, value) {
        const settings = JSON.parse(JSON.stringify(currentUser.settings)) 

        settings[setting] = value

        const userPatch = {
            id: currentUser.id,
            settings: settings
        }

        makeRequest(patchUser(userPatch))

    }

    const showAnnouncements = 'showAnnouncements' in currentUser.settings ? currentUser.settings.showAnnouncements : true
    const showInfo = 'showInfo' in currentUser.settings ? currentUser.settings.showInfo : true

    return (
        <div className="user-account-preferences-view">
            <h2>Platform Administrative Posts</h2>
            <div className="user-account-preferences-view__section">
                <p>Do you want to see informational and administrative posts shared by site administrators in your feed?</p>
                <Toggle 
                    label="Announcements"
                    explanation="See platform announcements in your feed. These can include release announcements, policy updates, and significant platform news."
                    toggled={showAnnouncements} 
                    onClick={(e) => setSetting('showAnnouncements', ! showAnnouncements)} />
                <Toggle 
                    label="Info"
                    explanation="See informational posts.  These can be minor news updates, descriptions of features, how tos, requests for feedback, etc..."
                    toggled={showInfo} 
                    onClick={(e) => setSetting('showInfo', ! showInfo)} />
            </div>
            <RequestErrorModal message={'Attempt to update Preferences'} request={request} />
        </div>
    )
}

export default UserAccountPreferencesView
