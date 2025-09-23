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
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

import { BellIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import { getNotifications, patchNotifications } from '/state/notifications'
import { patchDevice } from '/state/authentication'

import { 
    DropdownMenu, 
    DropdownMenuHeader, 
    DropdownMenuTrigger, 
    DropdownMenuBody,
    DropdownMenuModal
} from '/components/ui/DropdownMenu'
import Button from '/components/ui/Button'

import NotificationMenuItem from './NotificationMenuItem'

import './NotificationMenu.css'

const NotificationMenu = function({ }) {
    const device = useSelector((state) => state.authentication.device)

    const [request, makeRequest] = useRequest()
    const [markReadRequest, makeMarkReadRequest] = useRequest()
    const [patchDeviceRequest, makePatchDeviceRequest] = useRequest()

    const emptyList = []
    const notifications = useSelector((state) => 'NotificationMenu' in state.notifications.queries ? state.notifications.queries['NotificationMenu'].list : emptyList) 
    const notificationDictionary = useSelector((state) => state.notifications.dictionary)
    const unreadNotifications = notifications.filter((id) => ! notificationDictionary[id].isRead)

    useEventSubscription('Notification', 'create')

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

    const requestNotificationPermissions = function(event) {
        Notification.requestPermission().then((permission) => {
            makePatchDeviceRequest(patchDevice({ notificationPermission: permission }))
        })
    }

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

    let needToRequestPermission = false
    if ( device !== null && device.platform === 'web' ) {
        if ( ! ( "notificationPermission" in device ) || ( device.notificationPermission !== Notification.permission && device.notificationPermission !== 'denied')) {
            if ( "Notification" in window && Notification.permission !== 'granted' && Notification.permission !== 'denied' ) {
                needToRequestPermission = true
            }
        }
    }

    const unread = unreadNotifications.length
    return (
        <DropdownMenu className="notification-menu" autoClose={true}>
            <DropdownMenuTrigger className="notification-trigger" >
                <BellIcon />
                { unread > 0 && <div className="unread-indicator">{unread}</div> }
            </DropdownMenuTrigger>
            { needToRequestPermission && <DropdownMenuModal className="notification-permissions">
                <p>Show desktop notifications?</p>
                <p><Button onClick={(e) => makePatchDeviceRequest(patchDevice({ notificationPermission: 'denied'}))}>No</Button><Button onClick={requestNotificationPermissions} type="primary">Yes</Button></p>
            </DropdownMenuModal> }
            <DropdownMenuBody className="notification-body">
                <DropdownMenuHeader className="notification-header">
                    <span className="mark-read"><a href="" onClick={(e) =>  markAllRead(e) }>Mark All Read</a></span>
                </DropdownMenuHeader>
                { notificationViews }
            </DropdownMenuBody>
        </DropdownMenu>
    )

}

export default NotificationMenu
