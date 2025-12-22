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
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { BellIcon, BellAlertIcon, BellSlashIcon } from '@heroicons/react/24/outline'

import { patchGroupSubscription } from '/state/GroupSubscription'
import { resetPostSubscriptionSlice } from '/state/PostSubscription'

import { useRequest } from '/lib/hooks/useRequest'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuBody, DropdownMenuItem } from '/components/ui/DropdownMenu'

import './GroupSubscriptionControl.css'

const GroupSubscriptionControl = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const subscription = useSelector((state) => state.GroupSubscription.byGroupId[groupId])

    const [request, makeRequest] = useRequest()

    const dispatch = useDispatch()

    const changeStatus = function(status) {
        const subscriptionPatch = {
            groupId: groupId,
            userId: currentUser.id,
            status: status
        }

        makeRequest(patchGroupSubscription(subscriptionPatch))
    }

    useEffect(function() {
        if ( subscription.status === 'unsubscribed' && request?.state === 'fulfilled' ) {
            dispatch(resetPostSubscriptionSlice())
        }
    }, [ request, subscription ])

    if ( subscription === null || subscription === undefined ) {
        return null
    }

    let Icon = BellIcon
    if ( subscription.status === 'posts' ) {
        Icon = BellAlertIcon
    } else if ( subscription.status === 'unsubscribed' ) {
        Icon = BellSlashIcon
    }

    return (
        <DropdownMenu className="group-subscription-control" autoClose={true}>
            <DropdownMenuTrigger className="group-subscription-control__trigger"><Icon className="group-subscription-control__trigger__icon" /></DropdownMenuTrigger>
            <DropdownMenuBody>
                <DropdownMenuItem className="group-subscription-control__status" onClick={(e) => changeStatus('posts')}>
                    <div><BellAlertIcon /> Posts</div>
                    <div className="group-subscription-control__status__explanation">
                        Notify when new posts are made to this group, you are mentioned, or replied to.
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="group-subscription-control__status" onClick={(e) => changeStatus('mentions')}>
                    <div><BellIcon /> Mentions and Replies</div>
                    <div className="group-subscription-control__status__explanation">
                        Notify when you are mentioned or replied to.
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="group-subscription-control__status" onClick={(e) => changeStatus('unsubscribed')}>
                    <div><BellSlashIcon /> Unsubscribe</div>
                    <div className="group-subscription-control__status__explanation">
                        Only notify for posts in this group you have explicitly subscribed to. 
                    </div>
                </DropdownMenuItem>
            </DropdownMenuBody>
        </DropdownMenu>
    )
}

export default GroupSubscriptionControl
