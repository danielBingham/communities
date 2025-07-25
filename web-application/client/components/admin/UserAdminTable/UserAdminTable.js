import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers } from '/state/User'

import PaginationControls from '/components/PaginationControls'
import { Table, TableHeader, TableCell } from '/components/ui/Table'
import { RequestErrorModal } from '/components/errors/RequestError'
import Spinner from '/components/Spinner'

import UserAdminTableRow from './UserAdminTableRow'


import './UserAdminTable.css'

const UserAdminTable = function() {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const dictionary = useSelector((state) => state.User.dictionary)
    const query = useSelector((state) => 'UserAdmin' in state.User.queries ? state.User.queries['UserAdmin'] : null)
    const [request, makeRequest] = useRequest()

    useEffect(function() {
        let page = searchParams.get('page')
        page = page || 1
        makeRequest(getUsers('UserAdmin', { page: page, admin: true }))
    }, [ searchParams ])

    if ( ! query ) {
        return (
            <div className="user-admin-table">
                <Spinner />
            </div>
        )
    }

    const userRows = []
    if ( query !== null ) {
        for(const userId of query.list ) {
            const user = dictionary[userId]
            userRows.push(<UserAdminTableRow key={user.id} user={user} />)
        }
    }

    let explanation = ''
    if ( parseInt(query.meta.count) === 0 ) {
        explanation = `Showing 0 users`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `Showing ${pageStart} to ${pageEnd} of ${query.meta.count} Users`
    }

    return (
        <div className="user-admin-table">
            <div className="user-admin-header">
                {explanation} 
            </div>
            <Table className="user-admin-table__table">
                <TableHeader className="user-admin-table__header">
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell> 
                    <TableCell>Username</TableCell> 
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last Login Attempt</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell></TableCell>
                </TableHeader>
                { userRows }
            </Table>
            <PaginationControls meta={query?.meta} />
            <RequestErrorModal message="Getting Users" request={request} />
        </div>
    )

}

export default UserAdminTable
