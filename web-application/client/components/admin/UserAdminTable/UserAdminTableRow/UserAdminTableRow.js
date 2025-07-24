import React, { useEffect, useContext } from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import { TableRow, TableCell } from '/components/ui/Table'
import { DotsMenu, DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import DateTag from '/components/DateTag'
import { RequestErrorModal } from '/components/errors/RequestError'

import './UserAdminTableRow.css'

const UserAdminTableRow = function({ user }) {

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

    return (
        <TableRow className="user-admin-table__row">
            <TableCell>{ user.id }</TableCell>
            <TableCell>{ user.name }</TableCell> 
            <TableCell>{ user.username }</TableCell> 
            <TableCell>{ user.email }</TableCell> 
            <TableCell>{ user.status }</TableCell> 
            <TableCell>{ user.permissions }</TableCell>
            <TableCell><DateTag timestamp={user.lastAuthenticationAttemptDate} /></TableCell>
            <TableCell><DateTag timestamp={user.createdDate} /></TableCell>
            <TableCell>
                <DotsMenu>
                    { user.status !== 'banned' && <DotsMenuItem onClick={() => { changeUserStatus('banned')}}>Ban</DotsMenuItem> }
                    { user.status === 'banned' && <DotsMenuItem onClick={() => { changeUserStatus('confirmed')}}>Unban</DotsMenuItem> }
                </DotsMenu>
                <RequestErrorModal message={`Attemp to ${user.status !== 'banned' ? 'ban' : 'unban'} user`} request={request} />
            </TableCell>
        </TableRow>
    )
}

export default UserAdminTableRow
