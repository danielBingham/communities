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
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { BellIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { 
    FloatingMenu,
    FloatingMenuHeader,
    FloatingMenuTrigger,
    FloatingMenuBody
} from '/components/generic/floating-menu/FloatingMenu'

import { getNotifications, patchNotifications } from '/state/notifications'

import NotificationMenuItem from './NotificationMenuItem'

import './NotificationMenu.css'

const NotificationMenu = function({ }) {

    // ============ Request Tracking ==========================================

    const [request, makeRequest] = useRequest()
    const [markReadRequest, makeMarkReadRequest] = useRequest()

    // ============ Redux State ===============================================

    const emptyList = []
    const notifications = useSelector((state) => 'NotificationMenu' in state.notifications.queries ? state.notifications.queries['NotificationMenu'].list : emptyList) 
    const notificationDictionary = useSelector((state) => state.notifications.dictionary)
    const unreadNotifications = notifications.filter((id) => ! notificationDictionary[id].isRead)

    // ============ Helpers and Actions =======================================

    const markAllRead = function(event) {
        event.preventDefault()
        
        const notifications = []
        for(const id of unreadNotifications) {
            notifications.push({
                ...notificationDictionary[id],
                isRead: true
            })
        }

        makeMarkReadRequest(patchNotifications(notifications))  
    }



    // ============ Effect Handling ===========================================

    useEffect(function() {
        makeRequest(getNotifications('NotificationMenu'))
    }, [])

    // ============ Render ====================================================

    let notificationViews = []
    for(const id of notifications) {
        notificationViews.push(
            <NotificationMenuItem key={id} notificationId={id} />
        )
    }
    if ( notificationViews.length == 0 ) {
        notificationViews =  ( 
            <div className="empty-list">
                No notifications.
            </div>
        )
    }

    const unread = unreadNotifications.length
    return (
        <FloatingMenu className="notification-menu" closeOnClick={true}>
            <FloatingMenuTrigger className="notification-trigger" showArrow={false} >
                <BellIcon />
                { unread > 0 && <div className="unread-indicator">{unread}</div> }
            </FloatingMenuTrigger>
            <FloatingMenuBody className="notification-body">
                <div className="notification-header">
                    <span className="mark-read"><a href="" onClick={(e) =>  markAllRead(e) }>Mark All Read</a></span>
                </div>
                { notificationViews }
            </FloatingMenuBody>
        </FloatingMenu>
    )

}

export default NotificationMenu
