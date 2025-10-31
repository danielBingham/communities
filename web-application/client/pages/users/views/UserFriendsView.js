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
import { useParams, Link } from 'react-router-dom'

import { useUserByUsername } from '/lib/hooks/User'

import FriendList from '/components/friends/list/FriendList'
import Spinner from '/components/Spinner'
import Error404 from '/components/errors/Error404'
import { RequestErrorPage } from '/components/errors/RequestError'

import './UserFriendsView.css'

const UserFriendsView = function() {
    const { slug } = useParams()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [user, request] = useUserByUsername(slug)

    if ( user === undefined ) {
        if ( request?.state === 'failed' ) {
            return (
                <RequestErrorPage id="user-profile-page" message={'Attempt to retrieve User'} request={request} />
            )
        } else {
            return (
                <div className="user-friends-view">
                    <Spinner />
                </div>
            )
        }
    }

    if ( user === null ) {
        return (<Error404 />)
    }

    if ( user.id === currentUser.id && 'showFriendsOnProfile' in currentUser.settings && currentUser.settings.showFriendsOnProfile === false) {
        return (
            <div className="user-friends-view">
                <div className="user-friends-view__off">Your friends are not visible on your profile. You can view your friends <Link to="/friends">here</Link>.</div>
            </div>
        )
    }

    return (
        <div className="user-friends-view">
            <FriendList userId={user.id} params={{ status: 'confirmed' }} />
        </div>
    )


}

export default UserFriendsView
