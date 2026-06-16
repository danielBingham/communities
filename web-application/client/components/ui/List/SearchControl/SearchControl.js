/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { FunnelIcon } from '@heroicons/react/24/solid'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuBody, DropdownMenuItem } from '/components/ui/DropdownMenu'

import './SearchControl.css'

const SearchControl = function({ entity, fields, defaultField, className  }) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [field, setField] = useState(defaultField ? defaultField : 'q')
    const [search, setSearch] = useState(searchParams.get(field) || '')

    const timeoutId = useRef(null)

    const clearSearch = function() {
        searchParams.delete(field)
        searchParams.delete('sort')

        setSearchParams(searchParams)
        setSearch('')
    }

    const executeSearch = function() {
        searchParams.set(field, search)
        searchParams.set('sort', 'relevance')

        // When we execute a new search, go back to the first page.
        searchParams.delete('page')
        setSearchParams(searchParams)

    }

    const onChange = function(event) {
        const value = event.target.value

        if ( value === '' ) {
            searchParams.delete(field)
            searchParams.delete('sort')
            setSearchParams(searchParams)
        }

        setSearch(value)
    }

    const onKeyUp = function(event) {
        if ( event.key === 'Enter' ) {
            executeSearch()
            return
        } else if ( event.key === 'Escape' ) {
            clearSearch()
            return
        }
    }

    useEffect(() => {
        if ( search.length > 0 ) {
            if ( timeoutId.current ) {
                clearTimeout(timeoutId.current)
            }
            timeoutId.current = setTimeout(() => {
                executeSearch()
            }, 200)
        } else {
            if ( timeoutId.current ) {
                clearTimeout(timeoutId.current)
                clearSearch()
            }
        }

        return () => {
            if ( timeoutId.current ) {
                clearTimeout(timeoutId.current)
            }
        }
    }, [ field, search ])

    useEffect(function() {
        const q = searchParams.get(field)
        if ( q ) {
            setSearch(q)
        }
    }, [ searchParams ])

    const options = []
    if ( fields ) {
        for(const [id, name] of Object.entries(fields)) {
            options.push(
                <DropdownMenuItem key={id} onClick={() => { clearSearch(); setField(id) }}>{ name }</DropdownMenuItem>
            )
        }
    } 

    return (
        <div className={`list__search-control ${className ? className : ''}`}>
            { fields && <DropdownMenu className="list__search-control__field-selector" autoClose={true}>
                <DropdownMenuTrigger ariaLabel={`Choose field`}>
                    <span className="list__search-control__button"><FunnelIcon /><span className="nav-text">{ fields[field] }</span></span>
                </DropdownMenuTrigger>
                <DropdownMenuBody className="list__search-control__field-menu">
                    { options }
                </DropdownMenuBody>
            </DropdownMenu> }
            <input
                name="search"
                type="text"
                role="searchbox"
                aria-label={`Search ${entity}`}
                value={search}
                onChange={onChange}
                onKeyUp={onKeyUp}
                placeholder={`Search ${entity}...`}
                autoComplete="off"
            />
        </div>
    )

}

export default SearchControl
