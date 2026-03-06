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
import { useGroupQuery } from '/lib/hooks/Group'

import GroupBadge from '/components/groups/view/GroupBadge'

import { List, ListHeader, ListGridContent, SearchControl } from '/components/ui/List'
import PaginationControls from '/components/PaginationControls'
import Spinner from '/components/Spinner'
import Refresher from '/components/ui/Refresher'

import "./GroupList.css"

const GroupList = function({ params }) {
    const [query, request, reset] = useGroupQuery(params)

    let groupViews = []
    let explanation = ''
    if ( query !== null && query !== undefined ) {
        for(const id of query.list) {
            groupViews.push(<GroupBadge key={id} id={id} />)
        }

        if ( ! query || parseInt(query.meta.count) === 0 ) {
            explanation = `0 Groups`
        } else {
            const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
            const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

            explanation = (
                <span>
                    <span className="group-list__page">{pageStart} to {pageEnd}</span>
                    <span className="group-list__total">of {query.meta.count} Groups</span>
                </span>
            )
        }
    } else {
        groupViews = ( <Spinner /> )
        explanation = "Loading groups..."
    }

    return (
        <List className="group-list">
            <Refresher onRefresh={() => reset()} />
            <ListHeader explanation={explanation}><SearchControl entity="Groups" /></ListHeader>
            <ListGridContent>
                { groupViews }
            </ListGridContent>
            <PaginationControls meta={query?.meta} />
        </List>
    )

}

export default GroupList
