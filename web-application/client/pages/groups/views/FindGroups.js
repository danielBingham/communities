import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import Button from '/components/generic/button/Button'
import GroupList from '/components/groups/GroupList'

import './FindGroups.css'

const FindGroups = function() {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    const [search, setSearch ] = useState('')

    const executeSearch = function() {
        searchParams.set('q', search)
        setSearchParams(searchParams)
    }

    const onChange = function(event) {
        const value = event.target.value

        if ( value === '' ) {
            searchParams.delete('q')
            setSearchParams(searchParams)
        }

        setSearch(value)
    }

    useEffect(function() {
        const q = searchParams.get('q')
        if ( q ) {
            setSearch(q)
        }
    }, [ searchParams ])

    return (
        <div className="find-groups">
            <div className="search">
                <input
                    name="search"
                    type="text"
                    value={search}
                    onChange={onChange}
                    onKeyUp={(e) => e.key == "Enter" && executeSearch()}
                    placeholder="Search for groups..."
                />
                <Button type="primary" onClick={(e) => executeSearch()}>Search</Button>
            </div>
            <GroupList />
        </div>
    )
}

export default FindGroups
