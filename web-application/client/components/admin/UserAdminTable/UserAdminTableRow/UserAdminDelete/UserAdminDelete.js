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
import { useEffect, useContext, useState } from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteUser } from '/state/User'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import { RequestErrorModal } from '/components/errors/RequestError'
import AreYouSure from '/components/AreYouSure'

import './UserAdminDelete.css'

const UserAdminDelete = function({ user }) {

    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const closeMenu = useContext(CloseMenuContext)

    const executeDelete = function() {
        makeRequest(deleteUser(user))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

    return (
        <>
            <DotsMenuItem onClick={() => { setAreYouSure(true) }}>Delete</DotsMenuItem>
            <RequestErrorModal message={`Attemp to delete user`} request={request} />
            <AreYouSure className="user-admin-table__row__delete-user"
                isVisible={areYouSure}
                isPending={request && request.state === 'pending'}
                execute={executeDelete}
                cancel={() => setAreYouSure(false)}
            >
                <p>Are you sure you want to delete { user.name }?</p>
            </AreYouSure>
        </>
    )
}

export default UserAdminDelete
