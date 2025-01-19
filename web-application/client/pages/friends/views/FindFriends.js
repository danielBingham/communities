import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { XCircleIcon } from '@heroicons/react/24/solid'

import Button from '/components/generic/button/Button'
import UserListView from '/components/users/list/UserListView'

import './FindFriends.css'

const FindFriends = function() {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    const [search, setSearch ] = useState('')

    const executeSearch = function() {
        searchParams.set('q', search)
        setSearchParams(searchParams)
    }

    useEffect(function() {
        const q = searchParams.get('q')
        if ( q ) {
            setSearch(q)
        }
    }, [ searchParams ])

    return (
        <div className="find-friends">
            <div className="search">
                <input
                    name="search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyUp={(e) => e.key == "Enter" && executeSearch()}
                    placeholder="Search for people..."
                />
                <Button type="primary" onClick={(e) => executeSearch()}>Search</Button>
            </div>
            <UserListView  /> 
        </div>
    )

}

export default FindFriends
