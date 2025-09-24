import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

import Button from '/components/ui/Button'

import './SearchControl.css'

const SearchControl = function({ entity, className, onSubmit, onFocus }) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('q') || '')

    const executeSearch = function() {
        searchParams.set('q', search)
        setSearchParams(searchParams)
    }

    const clearSearch = function() {
        searchParams.delete('q')
        setSearchParams(searchParams)
        setSearch('')
    }

    const onChange = function(event) {
        const value = event.target.value

        if ( value === '' ) {
            searchParams.delete('q')
            setSearchParams(searchParams)
        }

        setSearch(value)
    }

    const onKeyUp = function(event) {
        if ( event.key === 'Enter' ) {
            executeSearch()
        } else if ( event.key === 'Escape' ) {
            clearSearch()
        }
    }

    useEffect(function() {
        const q = searchParams.get('q')
        if ( q ) {
            setSearch(q)
        }
    }, [ searchParams ])

    return (
        <div className="list__search-control">
            <input
                name="search"
                type="text"
                value={search}
                onChange={onChange}
                onKeyUp={onKeyUp}
                placeholder={`Search ${entity}...`}
                autoComplete="off"
            />
            <Button onClick={(e) => executeSearch()}><MagnifyingGlassIcon /> <span className="nav-text">Search</span></Button>
        </div>
    )

}

export default SearchControl
