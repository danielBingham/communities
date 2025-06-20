import React from 'react'
import { useSearchParams } from 'react-router-dom'

import { BarsArrowUpIcon } from '@heroicons/react/24/solid'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuBody, DropdownMenuItem } from '/components/ui/DropdownMenu'

import "./PostListSortControl.css"

const PostListSortControl = function() {
    const [searchParams, setSearchParams] = useSearchParams()

    const setSort = function(sort) {
        searchParams.set('sort', sort)
        setSearchParams(searchParams)
    }

    const sortTitleMap = {
        'newest': 'Newest',
        'active': 'Most Activity',
        'recent': 'Recent Activity'
    }

    const sort = searchParams.get('sort') || 'newest'
    return (
        <DropdownMenu className="post-list-sort-control" closeOnClick={true}>
            <DropdownMenuTrigger><span className="post-list-sort-control__button"><BarsArrowUpIcon /><span className="text"> { sortTitleMap[sort]}</span></span></DropdownMenuTrigger>
            <DropdownMenuBody>
                <DropdownMenuItem onClick={() => setSort('newest')}>Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort('active')}>Most Activity</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort('recent')}>Recent Activity</DropdownMenuItem>
            </DropdownMenuBody>
        </DropdownMenu>
    )
}

export default PostListSortControl
