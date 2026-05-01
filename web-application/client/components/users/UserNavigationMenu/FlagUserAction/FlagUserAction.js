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

import can, {Actions, Entities} from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'
import { useUser } from '/lib/hooks/User'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import { postSiteModerations } from '/state/SiteModeration'

import {  NavigationSubmenuAction, SubmenuCloseContext, SubmenuIsMobileContext } from '/components/ui/NavigationMenu'

import ErrorModal from '/components/errors/ErrorModal'
import WarningModal from '/components/errors/WarningModal'
import AreYouSure from '/components/AreYouSure'

import { ModerateForSiteModal } from '/components/admin/moderation'

import './FlagUserAction.css'

const FlagUserAction = function({ userId }) {
    const [ areYouSure, setAreYouSure] = useState(false)
    const [ showModal, setShowModal ] = useState(false)

    const isMobile = useContext(SubmenuIsMobileContext)
    const closeMenu = useContext(SubmenuCloseContext)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [user] = useUser(userId)

    const [siteModeration, siteModerationRequest] = useSiteModeration(user?.siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const [request, makeRequest] = useRequest()

    const flagForSite = function() {
        makeRequest(postSiteModerations({ userId: currentUser.id, status: 'flagged', userProfileId: userId }))
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            setAreYouSure(false)
            if ( isMobile ) {
                closeMenu()
            }
        } 
    }, [ request])

    if ( ! currentUser ) {
        return null
    }

    if ( ! user ) {
        return null
    }

    if ( request && request.state === 'failed' ) {
        if ( request.error.type == 'server-error' ) {
            return (
                <ErrorModal>
                    <p>Something went wrong on the backend while trying to flag the user.  This is a bug, please report it.</p>
                </ErrorModal>
            )
        } else if ( request.error.type === 'conflict' ) {
            return (
                <WarningModal>
                    <p>Someone already flagged that user. Moderators should handle it shortly.</p>
                </WarningModal>
            )
        } else {
            return (
                <ErrorModal>
                    <p>Something went wrong on while trying to flag the user.  This is probably a bug, please report it.</p>
                </ErrorModal>
            )
        }
    }

    if ( siteModeration !== null ) {
        if ( siteModeration.status === 'flagged' ) {
            if ( canModerateSite === true ) {
                return (
                    <>
                        <NavigationSubmenuAction className="flag-user flag-user__moderate" onClick={(e)=>setShowModal(true)} icon="Flag" text="Moderate for Site" />
                        <ModerateForSiteModal siteModerationId={user?.siteModerationId} isVisible={showModal} setIsVisible={setShowModal} />
                    </>

                )
            } else {
                return (
                    <NavigationSubmenuAction disabled={true} className="flag-user flag-user__flagged" icon="Flag" text="Flagged" />
                )
            }
        } else if ( siteModeration.status === 'approved' ) {
            return (
                <NavigationSubmenuAction disabled={true} className="flag-user flag-user__approved" icon="CheckCircle" text="Approved" />
            )
        } else if ( siteModeration.status === 'rejected' ) {
            return (
                <NavigationSubmenuAction disabled={true} className="flag-user flag-user__rejected" icon="XCircle" text="Removed" />
            )
        }
    }

    return (
        <>
            <NavigationSubmenuAction onClick={() => setAreYouSure(true)} icon="Flag" text="Flag for Site Moderators" />
            <AreYouSure className="flag-user" 
                isVisible={areYouSure} 
                isPending={request && request.state === 'pending'} 
                execute={flagForSite} 
                cancel={() => setAreYouSure(false)}
            > 
                <p><strong>Are you sure you want to flag this user for Site moderators?</strong></p>
                <div className="flag-user__explanation">
                    <p>
                        Flagging is for content that violates our Terms of
                        Service and our Content Policies. Content appropriate
                        for flagging:
                    </p>
                    <ul>
                        <li>Violates the Paradox of Tolerance by:
                            <ul>
                                <li>Denying someone's basic humanity and right to existence.</li>
                                <li>Targeting individuals or users based on protected characteristics.</li>
                            </ul>
                        </li>
                        <li>Propagates misinformation, disinformation, or propaganda.</li>
                        <li>Is spam or AI slop.</li>
                        <li>Is psychologically, emotionally, or physically abusive.</li>
                        <li>Is sexually explicit or graphic.</li>
                    </ul>
                    <p>
                        Once the user is flagged, it goes into the moderation
                        queue and we'll get to it as quickly as we can.
                    </p>
                </div>
            </AreYouSure>
        </>
    )

}

export default FlagUserAction
