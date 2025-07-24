import React from 'react'
import { useSearchParams } from 'react-router-dom'

import { ClockIcon } from '@heroicons/react/24/outline'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuBody, DropdownMenuItem } from '/components/ui/DropdownMenu'

import "./PostListSinceControl.css"

const PostListSinceControl = function() {
    const [searchParams, setSearchParams] = useSearchParams()

    const setSince = function(since) {
        searchParams.set('since', since)
        setSearchParams(searchParams)
    }

    const sinceTitleMap = {
        'day': 'Last Day',
        'week': 'Last Week',
        'month': 'Last Month',
        'always': 'All Time'
    }

    const since = searchParams.get('since') || 'always'
    return (
        <DropdownMenu className="post-list-since-control" autoClose={true}>
            <DropdownMenuTrigger><span className="post-list-since-control__button"><ClockIcon /><span className="text"> { sinceTitleMap[since]}</span></span></DropdownMenuTrigger>
            <DropdownMenuBody>
                <DropdownMenuItem onClick={() => setSince('day')}>Last Day</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSince('week')}>Last Week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSince('month')}>Last Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSince('always')}>All Time</DropdownMenuItem>
            </DropdownMenuBody>
        </DropdownMenu>
    )
}

export default PostListSinceControl
