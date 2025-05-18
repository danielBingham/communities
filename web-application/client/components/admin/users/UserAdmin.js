import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers } from '/state/users'

import DateTag from '/components/DateTag'
import './UserAdmin.css'

const UserAdmin = function({}) {

    const dictionary = useSelector((state) => state.users.dictionary)
    const query = useSelector((state) => 'UserAdmin' in state.users.queries ? state.users.queries['UserAdmin'] : null)
    const [request, makeRequest] = useRequest()

    useEffect(function() {
        makeRequest(getUsers('UserAdmin', { page: 1, admin: true }))
    }, [])

    const userRows = []
    if ( query !== null ) {
        for(const userId of query.list ) {
            const user = dictionary[userId]
            userRows.push(
                <div className="row user">
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
            <div className="row header">
                <span>Name</span> 
                <span>Username</span> 
                <span>Email</span>
                <span>Status</span>
                <span>Role</span>
                <span>Joined</span>
            </div>
            { userRows }
        </div>
    )
}

export default UserAdmin
