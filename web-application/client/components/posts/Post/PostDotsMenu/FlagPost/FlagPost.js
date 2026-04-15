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
import { useState, useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon as FlagIconOutline } from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon, FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid'

import can, {Actions, Entities} from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'
import { usePost } from '/lib/hooks/Post'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import { postSiteModerations } from '/state/SiteModeration'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

import ErrorModal from '/components/errors/ErrorModal'
import WarningModal from '/components/errors/WarningModal'
import AreYouSure from '/components/AreYouSure'

import { ModerateForSiteModal } from '/components/admin/moderation'

import './FlagPost.css'

const FlagPost = function({ postId } ) {
    const [ areYouSureSite, setAreYouSureSite ] = useState(false)
    const [ showModal, setShowModal ] = useState(false)

    const closeMenu = useContext(CloseMenuContext)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [post, postRequest] = usePost(postId)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const [request, makeRequest] = useRequest()

    const flagForSite = function() {
        makeRequest(postSiteModerations({ userId: currentUser.id, status: 'flagged', postId: postId }))
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            setAreYouSureSite(false)
            closeMenu()
        } 
    }, [ request])

    if ( ! currentUser ) {
        return null
    }

    if ( ! post ) {
        return null
    }

    // Users aren't going to flag their own posts. Or if they do, they are
    // almost certainly acting maliciously to gum up the works. Don't let
    // them flag their own posts.
    if ( currentUser.id === post.userId ) {
        return null
    }

    if ( request && request.state === 'failed' ) {
        if ( request.error.type == 'server-error' ) {
            return (
                <ErrorModal>
                    <p>Something went wrong on the backend while trying to flag the post.  This is a bug, please report it.</p>
                </ErrorModal>
            )
        } else if ( request.error.type === 'conflict' ) {
            return (
                <WarningModal>
                    <p>Someone already flagged that post. Moderators should handle it shortly.</p>
                </WarningModal>
            )
        } else {
            return (
                <ErrorModal>
                    <p>Something went wrong on while trying to flag the post.  This is probably a bug, please report it.</p>
                </ErrorModal>
            )
        }
    }

    if ( siteModeration !== null ) {
        if ( siteModeration.status === 'flagged' ) {
            if ( canModerateSite === true ) {
                return (
                    <>
                        <DotsMenuItem className="flag-post flag-post__moderate" onClick={(e)=>setShowModal(true)}><FlagIconSolid /> Moderate for Site</DotsMenuItem>
                        <ModerateForSiteModal postId={postId} isVisible={showModal} setIsVisible={setShowModal} />
                    </>

                )
            } else {
                return (
                    <DotsMenuItem disabled={true} className="flag-post flag-post__flagged"><FlagIconSolid /> Flagged</DotsMenuItem>
                )
            }
        } else if ( siteModeration.status === 'approved' ) {
            return (
                <DotsMenuItem disabled={true} className="flag-post flag-post__approved"><CheckCircleIcon /> Approved</DotsMenuItem>
            )
        } else if ( siteModeration.status === 'rejected' ) {
            return (
                <DotsMenuItem disabled={true} className="flag-post flag-post__rejected"><XCircleIcon /> Removed</DotsMenuItem>
            )
        }
    }

    return (
        <>
            <DotsMenuItem onClick={(e) => setAreYouSureSite(true)} className="flag-post"><FlagIconOutline /> Flag for Site Moderators</DotsMenuItem>
            <AreYouSure className="flag-post" 
                isVisible={areYouSureSite} 
                isPending={request && request.state === 'pending'} 
                execute={flagForSite} 
                cancel={() => setAreYouSureSite(false)}
            > 
                <p><strong>Are you sure you want to flag this post for Site moderators?</strong></p>
                <div className="flag-post__explanation">
                    <p>
                        Flagging is for content that violates our Terms of
                        Service and our Content Policies. Content appropriate
                        for flagging:
                    </p>
                    <ul>
                        <li>Violates the Paradox of Tolerance by:
                            <ul>
                                <li>Denying someone's basic humanity and right to existence.</li>
                                <li>Targeting individuals or groups based on protected characteristics.</li>
                            </ul>
                        </li>
                        <li>Propagates misinformation, disinformation, or propaganda.</li>
                        <li>Is spam or AI slop.</li>
                        <li>Is psychologically, emotionally, or physically abusive.</li>
                        <li>Is sexually explicit or graphic.</li>
                    </ul>
                    <p>
                        Once the post is flagged, it goes into the moderation
                        queue and we'll get to it as quickly as we can.
                    </p>
                </div>
            </AreYouSure>
        </>
    )
}

export default FlagPost 
