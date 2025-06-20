import React from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import Button from '/components/generic/button/Button'

import './PaginationControls.css'

const PaginationControls = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const defaultMeta = {
        count: 0,
        page: 1,
        pageSize: 1,
        numberOfPages: 1
    }
    const meta = props.meta ? props.meta : defaultMeta 

    const goToPage = function(page) {
        searchParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, page)
        setSearchParams(searchParams)

        if ( props.section ) {
            props.setSection(props.section)
        }
    }

    if ( meta.count <= meta.pageSize) {
        return null 
    }

    const page = searchParams.get(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`) ? parseInt(searchParams.get(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`)) : 1

    const firstPage = 1
    const firstPageParams = new URLSearchParams(searchParams.toString())
    firstPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, firstPage)

    const prevPage = ( page-1 < 1 ? 1 : page-1)
    const prevPageParams = new URLSearchParams(searchParams.toString())
    prevPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, prevPage)

    const nextPage = ( page+1 >= meta.numberOfPages ? meta.numberOfPages : page+1)
    const nextPageParams = new URLSearchParams(searchParams.toString())
    nextPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, nextPage)

    const lastPage = meta.numberOfPages
    const lastPageParams = new URLSearchParams(searchParams.toString())
    lastPageParams.set(`${ ( props.prefix ? `${props.prefix}-` : '' )}page`, lastPage)

    return (
        <div className="page-controls">
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(firstPage)}}>First</Button></div>
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(prevPage)}}>Previous</Button></div>
            <div><span className="control">Page { page } of { meta.numberOfPages }</span></div>
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(nextPage)}}>Next</Button></div>
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(lastPage)}}>Last</Button></div>
        </div>
    )

}

export default PaginationControls
