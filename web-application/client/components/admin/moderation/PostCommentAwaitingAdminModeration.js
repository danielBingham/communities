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
import { useSelector } from 'react-redux'

import can, {Actions, Entities} from '/lib/permission'

import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { usePost, usePostLink } from '/lib/hooks/Post'

import PostComment from '/components/posts/PostComment'
import SiteModerationForm from '/components/admin/moderation/SiteModerationForm'

import Card from '/components/ui/Card'
import Button from '/components/ui/Button'

import './PostCommentAwaitingAdminModeration.css'

const PostCommentAwaitingAdminModeration = function({ siteModerationId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [moderation, siteModerationRequest, reloadSiteModeration] = useSiteModeration(siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const [post, postRequest, reloadPost] = usePost(moderation?.postId)
    const link = usePostLink(post?.id)


    if ( canModerateSite !== true ) {
        return null
    }

    if ( siteModerationId === undefined || siteModerationId === null ) { 
        return null 
    }

    if ( ( moderation === undefined || moderation === null ) 
        && ( siteModerationRequest === null || siteModerationRequest?.state === 'pending') 
    ) {
        return null
    }


    if ( moderation === undefined || moderation === null ) {
        return (
            <div className="post-comment-awaiting-admin-moderation">
                <div className="post-comment-awaiting-admin-moderation__not-found">
                    <p>404 Moderation Not Found</p>
                    <Button type="warning" onClick={() => reloadSiteModeration()}>Retry</Button>
                </div>
            </div>
        )

    }

    if ( post === undefined || post === null ) {
        return (
            <div className="post-comment-awaiting-admin-moderation">
                <div className="post-comment-awaiting-admin-moderation__not-found">
                    <p>404 Post Not Found</p>
                    <Button type="warning" onClick={() => reloadPost()}>Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <Card className="post-comment-awaiting-admin-moderation">
            <div className="post-comment-awaiting-admin-moderation__context">
                <a href={`${link}#comment-${moderation.postCommentId}`}>View Context</a>
            </div>
            <PostComment postId={moderation.postId} id={moderation.postCommentId} />
            <div className="post-comment-awaiting-admin-moderation__form">
                <SiteModerationForm siteModerationId={siteModerationId} />
            </div>
        </Card>
    )
}

export default PostCommentAwaitingAdminModeration
