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
import { Link } from 'react-router-dom'

import {
    GlobeAltIcon,
    LockOpenIcon,
    LockClosedIcon,
    UserGroupIcon,
    DocumentCheckIcon,
} from '@heroicons/react/24/outline'

import { useGroupPermissionContext } from '/lib/hooks/Group'

import GroupImage from '/components/groups/view/GroupImage'

import Spinner from '/components/Spinner'

import './GroupProfile.css'

const GroupProfile = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context?.group
    const parentGroup = context?.parentGroup

    if ( group === undefined || requests.hasPending() ) {
        return (
            <div className="group-profile">
                <Spinner />
            </div>
        )
    }

    let type = ''
    if ( group.type == 'open' ) {
        type = ( <span><GlobeAltIcon /> Public</span>)
    } else if ( group.type == 'private' || group.type === 'hidden-private' ) {
        type = (<span><LockOpenIcon /> Private</span>)
    } else if ( group.type == 'hidden' ) {
        type = (<span><LockClosedIcon /> Hidden</span>)
    } else if ( group.type == 'private-open' || group.type === 'hidden-open' ) {
        type = ( <span><GlobeAltIcon /> Open</span>)
    }


    let postingPermissions = ''
    if ( group.postPermissions === 'anyone' ) {
        postingPermissions = ( <span><GlobeAltIcon /> Anyone may Post</span> )
    } else if ( group.postPermissions === 'members' ) {
        postingPermissions = ( <span><UserGroupIcon /> Members may Post</span> )
    } else if ( group.postPermissions === 'approval' ) {
        postingPermissions = ( <span><DocumentCheckIcon /> Posts Require Approval</span> )
    } else if ( group.postPermissions === 'restricted' ) {
        postingPermissions = ( <span><LockClosedIcon /> Only Moderators may Post</span> )
    }

    return (
        <div className="group-profile">
            <div className="group-profile__header">
                <GroupImage groupId={group.id} />
                <div className="title">{ group.title}</div>
                <div className="types">
                    <span className="type">{ type }</span>
                    <span className="post-permissions">{ postingPermissions }</span>
                </div>
                { parentGroup && <div className="group-profile__parent">
                    Part of <Link to={`/group/${parentGroup.slug}`}>{ parentGroup.title }</Link>
                </div> }
            </div>
            <div className="group-profile__details">
                <div className="group-profile__about"> { group.about }</div>
            </div>
        </div>
    )
}

export default GroupProfile
