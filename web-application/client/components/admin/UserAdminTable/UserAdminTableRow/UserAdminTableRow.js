import React from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/users'

import ErrorModal from '/components/errors/ErrorModal'
import DateTag from '/components/DateTag'
import { DotsMenu, DotsMenuItem } from '/components/ui/DotsMenu'

import './UserAdminTableRow.css'

const UserAdminTableRow = function({ user, header }) {

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

    if ( header ) {
        return (
            <div className="user-admin-table-row user-admin-table-row__header">
                <span>ID</span>
                <span>Name</span> 
                <span>Username</span> 
                <span>Email</span>
                <span>Status</span>
                <span>Role</span>
                <span>Joined</span>
                <span></span>
            </div>
        )
    } else {
        return (
            <div className="user-admin-table-row user-admin-table-row__user">
                <span>{ user.id }</span>
                <span>{ user.name }</span> 
                <span>{ user.username }</span> 
                <span>{ user.email }</span> 
                <span>{ user.status }</span> 
                <span>{ user.permissions }</span>
                <span><DateTag timestamp={user.createdDate} /></span>
                <span>
                    <DotsMenu>
                        { user.status !== 'banned' && <DotsMenuItem onClick={() => { changeUserStatus('banned')}}>Ban</DotsMenuItem> }
                        { user.status === 'banned' && <DotsMenuItem onClick={() => { changeUserStatus('confirmed')}}>Unban</DotsMenuItem> }
                    </DotsMenu>
                    { error } 
                </span>
            </div>
        )
    }
}

export default UserAdminTableRow
