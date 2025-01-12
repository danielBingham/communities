import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import './SortControl.css'

const SortControl = function({ queryName }) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Effect Handling ======================================
    
    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)

        localStorage.setItem(`${queryName}.sort`, sortBy)
    }

    useEffect(function() {
        const sort = localStorage.getItem(`${queryName}.sort`)
        if ( sort && sort !== 'active' && sort !== searchParams.get('sort') ) {
            searchParams.set('sort', sort)
            setSearchParams(searchParams)
        }
    }, [queryName, searchParams])
    // ====================== Render ==========================================

    const sort = searchParams.get('sort') ? searchParams.get('sort') : 'active'
   
    return (
        <div className="sort-menu">
            <span className="title">Sort By:</span>
            <a
                href=""
                className={`sort-option ${sort == 'active' ? 'current' : ''}`}
                onClick={(e) => {setSort('active')}}
            >
                Active 
            </a>
            <a
                href=""
                className={`sort-option ${sort == 'newest' ? 'current' : ''}`} 
                onClick={(e) => {setSort('newest')}}
            >
                New 
            </a>
        </div>
    )
}

export default SortControl
