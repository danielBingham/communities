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

import PrivacyControl from '/components/users/account/PrivacyControl'
import Card from '/components/ui/Card'
import { RequestErrorModal } from '/components/errors/RequestError'


import './UserAccountPreferencesView.css'

const UserAccountPreferencesView = function() {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const setViewFriends = function(value) {
        const userPatch = {
            id: currentUser.id,
            privacyViewFriends: value 
        }

        makeRequest(patchUser(userPatch))
    }

    const setViewMutualFriends = function(value) {
        const userPatch = {
            id: currentUser.id,
            privacyViewMutualFriends: value 
        }

        makeRequest(patchUser(userPatch))
    }

    return (
        <div className="user-account-preferences-view">
            <h2>Friends</h2>
            <Card className="user-account-preferences-view__section">
                <p>These settings control who can see your friends and relationships.</p>
                <PrivacyControl
                    label="Who can see your friends?"
                    explanation="Choose who can see the list of your friends on your profile."
                    value={currentUser.privacyViewFriends}
                    setValue={(value) => setViewFriends(value)}
                />
                <PrivacyControl
                    label="Who can see your mutual friends?"
                    explanation="Choose who can see whether they have mutual friends with you, and who those mutual friends are."
                    value={currentUser.privacyViewMutualFriends}
                    setValue={(value) => setViewMutualFriends(value)}
                />
            </Card>
            <RequestErrorModal message={'Attempt to update Preferences'} request={request} />
        </div>
    )
}

export default UserAccountPreferencesView
