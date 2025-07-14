import React from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import { TableRow, TableCell } from '/components/ui/Table'
import ErrorModal from '/components/errors/ErrorModal'
import DateTag from '/components/DateTag'
import { DotsMenu, DotsMenuItem } from '/components/ui/DotsMenu'

import './UserAdminTableRow.css'

const UserAdminTableRow = function({ user }) {

    const [request, makeRequest] = useRequest()

    const changeUserStatus = function(status) {
        makeRequest(patchUser({ id: user.id, status: status }))
    }

  
    let error = null
    if ( request && request.state === 'failed' ) {
        error = (
            <ErrorModal>
                <p>Failed to ban "{ user.name }".</p>
                <p>Error: { request.error.type }</p>
                <p>Message: { request.error.message }</p>
            </ErrorModal>
        )
    }

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
                { error } 
            </TableCell>
        </TableRow>
    )
}

export default UserAdminTableRow
