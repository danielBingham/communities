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
import { useEffect, useContext } from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import {  DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import { RequestErrorModal } from '/components/errors/RequestError'

import './UserAdminUpdateStatus.css'

const UserAdminUpdateStatus = function({ user, requiredStatus, status, text }) {

    const [request, makeRequest] = useRequest()

    const closeMenu = useContext(CloseMenuContext)

    const changeUserStatus = function(status) {
        makeRequest(patchUser({ id: user.id, status: status }))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

    if ( user.status !== requiredStatus ) {
        return null
    }

    return (
        <>
            <DotsMenuItem onClick={() => { changeUserStatus(status) }}>{ text }</DotsMenuItem>
            <RequestErrorModal message={`Attempt to change status to ${status}`} request={request} />
        </>
    )
}

export default UserAdminUpdateStatus

