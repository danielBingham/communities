import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers } from '/state/users'

import DateTag from '/components/DateTag'
import PaginationControls from '/components/PaginationControls'


import './UserAdmin.css'

const UserAdmin = function({}) {
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
            userRows.push(
                <div className="user-admin__row user-admin__user">
                    <span>{ user.id }</span>
                    <span>{ user.name }</span> 
                    <span>{ user.username }</span> 
                    <span>{ user.email }</span> 
                    <span>{ user.status }</span> 
                    <span>{ user.permissions }</span>
                    <span><DateTag timestamp={user.createdDate} /></span>
                </div>
            )
        }
    }

    return (
        <div className="user-admin">
            <div className="user-admin__row user-admin__header">
                <span>ID</span>
                <span>Name</span> 
                <span>Username</span> 
                <span>Email</span>
                <span>Status</span>
                <span>Role</span>
                <span>Joined</span>
            </div>
            { userRows }
            <PaginationControls meta={query?.meta} />
        </div>
    )
}

export default UserAdmin
