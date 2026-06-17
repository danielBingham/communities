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
import { useSearchParams } from 'react-router-dom'

import { BarsArrowUpIcon } from '@heroicons/react/24/solid'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuBody, DropdownMenuItem } from '/components/ui/DropdownMenu'

import "./UserListSortControl.css"

const UserListSortControl = function() {
    const [searchParams, setSearchParams] = useSearchParams()

    const setSort = function(sort) {
        searchParams.set('sort', sort)
        setSearchParams(searchParams)
    }

    const sortTitleMap = {
        'newest': 'Newest',
        'oldest': 'Oldest'
    }

    if ( searchParams.get('q') ) {
        sortTitleMap['relevance'] = 'Relevance'
    }

    const sort = searchParams.get('sort') || 'newest'
    return (
        <DropdownMenu className="user-list-sort-control" autoClose={true}>
            <DropdownMenuTrigger ariaLabel={`Sort: ${sortTitleMap[sort]}`}><span className="user-list-sort-control__button"><BarsArrowUpIcon /><span className="text"> { sortTitleMap[sort]}</span></span></DropdownMenuTrigger>
            <DropdownMenuBody>
                { searchParams.get('q') && <DropdownMenuItem onClick={() => setSort('relevance')}>Relevance</DropdownMenuItem> }
                <DropdownMenuItem onClick={() => setSort('newest')}>Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort('oldest')}>Oldest</DropdownMenuItem>
            </DropdownMenuBody>
        </DropdownMenu>
    )
}

export default UserListSortControl
