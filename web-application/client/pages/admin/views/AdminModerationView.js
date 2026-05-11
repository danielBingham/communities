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
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getSiteModerations } from '/state/SiteModeration'

import GroupAwaitingModeration from '/components/admin/GroupAwaitingModeration'
import PostAwaitingModeration from '/components/admin/PostAwaitingModeration'
import PostCommentAwaitingAdminModeration from '/components/admin/moderation/PostCommentAwaitingAdminModeration'
import UserAwaitingModeration from '/components/admin/UserAwaitingModeration'

import PaginationControls from '/components/PaginationControls'

import './AdminModerationView.css'

const AdminModerationView = function({}) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ request, makeRequest ] = useRequest()

    const query = useSelector((state) => 'AdminModerationView' in state.SiteModeration.queries ? state.SiteModeration.queries['AdminModerationView']: null)
    const dictionary = useSelector((state) => state.SiteModeration.dictionary)


    useEffect(function() {
        let page = searchParams.get('page')
        page = page || 1

        makeRequest(getSiteModerations('AdminModerationView', { status: 'flagged', page: page }))
    }, [])

    const moderationViews = []
    if ( query !== null ) {
        for(const moderationId of query.list) {
            const moderation = dictionary[moderationId]
            if ( moderation.status !== 'flagged' ) {
                continue
            }

            if ( moderation.postId !== null && moderation.postCommentId === null) {
                moderationViews.push(<PostAwaitingModeration key={moderation.id} siteModerationId={moderation.id} />)
            } else if ( moderation.postId !== null && moderation.postCommentId !== null ) {
                moderationViews.push(<PostCommentAwaitingAdminModeration key={moderation.id} siteModerationId={moderation.id} />)
            } else if ( moderation.groupId !== null ) {
                moderationViews.push(<GroupAwaitingModeration key={moderation.id} siteModerationId={moderation.id} />)
            } else if ( moderation.userProfileId !== null ) {
                moderationViews.push(<UserAwaitingModeration key={moderation.id} siteModerationId={moderation.id} />)
            }
        }
    }

    return (
        <div className="admin-moderation-view">
            <div className="admin-moderation-view__header">{ query?.meta.count } items to moderate</div>
            <div className="admin-moderation-view__list">
                { moderationViews }
            </div>
            <PaginationControls meta={query?.meta} />
        </div>
    )
}

export default AdminModerationView
