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
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { getGroup } from '/state/Group'

import GroupImage from '/components/groups/view/GroupImage'

import { ListGridContentItem } from '/components/ui/List'
import DateTag from '/components/DateTag'

import './GroupBadge.css'

const GroupBadge = function({ id }) {
    
    const hasRules = useFeature('issue-330-group-short-description-and-rules')
    const hasActiveStats = useFeature('feat-484-find-active-groups')

    // ======= Request Tracking =====================================
   
    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================
    
    const group = useSelector((state) => id in state.Group.dictionary ? state.Group.dictionary[id] : null)

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( ! group ) {
            makeRequest(getGroup(id))
        }
    }, [ group ])

    // ======= Render ===============================================
    
    if( ! group && ( ! request || request.status == 'pending' )) {
        return null 
    }

    const groupTypes = {
        open: 'Public',
        private: 'Private',
        hidden: 'Hidden',
        'private-open': 'Open',
        'hidden-open': 'Open',
        'hidden-private': 'Private'
    }

    if ( group ) {
        return (
            <ListGridContentItem className="group-badge">
                <div className="group-badge__grid">
                    <GroupImage groupId={group.id} />
                    <div className="group-badge__details" >
                        <div className="group-badge__title"><Link to={ `/group/${group.slug}` }>{group.title}</Link></div>
                        { ! hasRules && <div className="group-badge__about">{ group.about?.length > 100 ? group.about.substring(0,100).trim()+'...' : group.about }</div> }
                        { hasRules && <div className="group-badge__about">{ group.shortDescription }</div> }
                    </div> 
                </div>
                { hasActiveStats && <div className="group-badge__stats">
                    <span>{ groupTypes[group.type] } &bull; { group.totalMembers} members &bull; { group.totalPosts } posts &bull; <span><DateTag timestamp={group.mostRecentPostDate} type="short" /></span></span>
                </div> }
            </ListGridContentItem>
        )
    } else {
        return (null)
    }

}

export default GroupBadge 
