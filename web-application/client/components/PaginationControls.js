import { useSearchParams } from 'react-router-dom'

import Button from '/components/generic/button/Button'

import './PaginationControls.css'

const PaginationControls = function({ meta }) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const defaultMeta = {
        count: 0,
        page: 1,
        pageSize: 1,
        numberOfPages: 1
    }
    meta = meta ? meta: defaultMeta 


    const goToPage = function(page) {
        searchParams.set(`page`, page)
        setSearchParams(searchParams)
    }

    if ( meta.count <= meta.pageSize) {
        return null 
    }

    const page = searchParams.get(`page`) ? parseInt(searchParams.get(`page`)) : 1

    const firstPage = 1
    const firstPageParams = new URLSearchParams(searchParams.toString())
    firstPageParams.set(`page`, firstPage)

    const prevPage = ( page-1 < 1 ? 1 : page-1)
    const prevPageParams = new URLSearchParams(searchParams.toString())
    prevPageParams.set(`page`, prevPage)

    const nextPage = ( page+1 >= meta.numberOfPages ? meta.numberOfPages : page+1)
    const nextPageParams = new URLSearchParams(searchParams.toString())
    nextPageParams.set(`page`, nextPage)

    const lastPage = meta.numberOfPages
    const lastPageParams = new URLSearchParams(searchParams.toString())
    lastPageParams.set(`page`, lastPage)

    return (
        <div className="page-controls">
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(firstPage)}}>First</Button></div>
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(prevPage)}}>Previous</Button></div>
            <div><span className="control">{ page } of { meta.numberOfPages }</span></div>
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(nextPage)}}>Next</Button></div>
            <div><Button onClick={(e) => {e.preventDefault(); goToPage(lastPage)}}>Last</Button></div>
        </div>
    )

}

export default PaginationControls
