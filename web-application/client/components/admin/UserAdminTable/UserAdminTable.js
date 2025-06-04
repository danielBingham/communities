import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers } from '/state/users'

import PaginationControls from '/components/PaginationControls'

import UserAdminTableRow from './UserAdminTableRow'

import './UserAdminTable.css'

const UserAdminTable = function() {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const dictionary = useSelector((state) => state.users.dictionary)
    const query = useSelector((state) => 'UserAdmin' in state.users.queries ? state.users.queries['UserAdmin'] : null)
    const [request, makeRequest] = useRequest()

    useEffect(function() {
        let page = searchParams.get('page')
        page = page || 1
        makeRequest(getUsers('UserAdmin', { page: page, admin: true }))
    }, [])

    const userRows = []
    if ( query !== null ) {
        for(const userId of query.list ) {
            const user = dictionary[userId]
            userRows.push(<UserAdminTableRow key={user.id} user={user} />)
        }
    }

    return (
        <div className="user-admin-table">
            <UserAdminTableRow header={true} />
            { userRows }
            <PaginationControls meta={query?.meta} />
        </div>
    )

}

export default UserAdminTable
