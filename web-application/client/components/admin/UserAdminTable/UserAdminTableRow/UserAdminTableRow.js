import React, { useEffect, useContext, useState } from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser, deleteUser } from '/state/User'

import { TableRow, TableCell } from '/components/ui/Table'
import { DotsMenu, DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import DateTag from '/components/DateTag'
import { RequestErrorModal } from '/components/errors/RequestError'
import AreYouSure from '/components/AreYouSure'

import './UserAdminTableRow.css'

const UserAdminTableRow = function({ user }) {

    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const closeMenu = useContext(CloseMenuContext)

    const changeUserStatus = function(status) {
        makeRequest(patchUser({ id: user.id, status: status }))
    }

    const executeDelete = function() {
        makeRequest(deleteUser(user))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

    return (
        <TableRow className="user-admin-table__row">
            <TableCell>{ user.id }</TableCell>
            <TableCell>{ user.name }</TableCell> 
            <TableCell>{ user.username }</TableCell> 
            <TableCell>{ user.email }</TableCell> 
            <TableCell>{ user.status }</TableCell> 
            <TableCell>{ user.siteRole}</TableCell>
            <TableCell><DateTag timestamp={user.lastAuthenticationAttemptDate} /></TableCell>
            <TableCell><DateTag timestamp={user.createdDate} /></TableCell>
            <TableCell>
                <DotsMenu>
                    { user.status !== 'banned' && <DotsMenuItem onClick={() => { changeUserStatus('banned')}}>Ban</DotsMenuItem> }
                    { user.status === 'banned' && <DotsMenuItem onClick={() => { changeUserStatus('confirmed')}}>Unban</DotsMenuItem> }
                    <DotsMenuItem onClick={() => { setAreYouSure(true) }}>Delete</DotsMenuItem>
                </DotsMenu>
                <RequestErrorModal message={`Attemp to ${user.status !== 'banned' ? 'ban' : 'unban'} user`} request={request} />
            </TableCell>
            <AreYouSure className="user-admin-table__row__delete-user"
                isVisible={areYouSure}
                isPending={request && request.state === 'pending'}
                execute={executeDelete}
                cancel={() => setAreYouSure(false)}
            >
                <p>Are you sure you want to delete { user.name }?</p>
            </AreYouSure>
        </TableRow>
    )
}

export default UserAdminTableRow
