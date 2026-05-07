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
import { Link } from 'react-router-dom'

import { useUser } from '/lib/hooks/User'

import UserProfileImage from '/components/users/UserProfileImage'

import { ListGridContentItem } from '/components/ui/List'

import MutualsTag from '/components/Mutuals/MutualsTag'

import './UserBadge.css'

const UserBadge = function({ id, children }) {

    const [user, request] = useUser(id)

    // ======= Render ===============================================
    if( ! user && ( ! request || request.status == 'pending' )) {
        return null 
    }

    // TECHDEBT: The request will return a 404 not found in certain circumstances
    // where someone has a userId (through a relationship gained through an
    // invite, for example), but a user hasn't finished registering and
    // confirmed yet.  In those circumstances, the FriendList will create a
    // user badge with the ID, but the GET /user/:id endpoint will return 404
    // because of the unconfirmed status.
    //
    // In that case, we'll just return null for now.
    if ( user ) {
        return (
            <ListGridContentItem className="user-badge">
                <div className="user-badge__top__grid">
                    <UserProfileImage userId={user.id} />
                    <div className="user-badge__details" >
                        { user.username !== null && <div className="user-badge__name"><Link to={ `/${user.username}` }>{user.name}</Link></div>}
                        { user.username === null && user.email !== null && <div className="user-badge__name">{ user.email }</div> }
                        <div className="user-badge__about">{ user.about?.length > 180 ? user.about.substring(0,180).trim()+'...' : user.about }</div>
                    </div> 
                </div>
                <div className="user-badge__bottom-grid">
                    <div className="user-badge__mutuals">
                        <MutualsTag id={id} />
                    </div>
                    <div className="user-badge__controls">
                        <div>
                            { children }
                        </div>
                    </div>
                </div>
            </ListGridContentItem>
        )
    } else {
        return (null)
    }

}

export default UserBadge 
