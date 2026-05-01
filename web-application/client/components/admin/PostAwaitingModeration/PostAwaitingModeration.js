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

import { usePostLink } from '/lib/hooks/Post'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import Post from '/components/posts/Post'
import SiteModerationForm from '/components/admin/moderation/SiteModerationForm'

import Card from '/components/ui/Card'
import Button from '/components/ui/Button'

import './PostAwaitingModeration.css'

const PostAwaitingModeration = function({ siteModerationId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [moderation, siteModerationRequest, reloadSiteModeration] = useSiteModeration(siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const link = usePostLink(moderation?.postId)

    // The user doesn't have permission to moderation the site.
    if ( canModerateSite !== true ) {
        return null
    }

    // We weren't given a SiteModeration.id.
    if ( siteModerationId === undefined || siteModerationId === null ) { 
        return null 
    }

    // We haven't loaded the SiteModeration yet.  We haven't started to load it
    // yet, or we're in the process of loading it.
    if ( ( moderation === undefined || moderation === null ) 
        && ( siteModerationRequest === null || siteModerationRequest?.state === 'pending') 
    ) {
        return null
    }

    // We failed to load the SiteModeration.  Try again?
    if ( moderation === undefined || moderation === null ) {
        return (
            <div className="post-awaiting-moderation">
                <div className="post-awaiting-moderation__not-found">
                    <p>404 Moderation Not Found</p>
                    <Button type="warning" onClick={() => reloadSiteModeration()}>Retry</Button>
                </div>
            </div>
        )

    }

    return (
        <Card className="post-awaiting-moderation">
            <div className="group-awaiting-moderation__context">
                <a href={`${link}`}>View Context</a>
            </div>
            <div className="post-awaiting-moderation__profile">
                <Post id={moderation.postId} shared={true} />
            </div>
            <div className="post-awaiting-moderation__form">
                <SiteModerationForm siteModerationId={siteModerationId} />
            </div>
        </Card>
    )

}

export default PostAwaitingModeration
