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
import { useState } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon } from '@heroicons/react/20/solid'

import can, {Actions, Entities} from '/lib/permission'

import { useSiteModeration } from '/lib/hooks/SiteModeration'

import ModerateForSiteModal from './ModerateForSiteModal'

import './ModerateForSite.css'

const ModerateForSite = function({ siteModerationId }) {
    const [showModal, setShowModal] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [siteModeration, siteModerationRequest] = useSiteModeration(siteModerationId) 
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    if ( siteModeration === null ) {
        return null
    }

    if ( siteModeration.status === 'approved' || siteModeration.status === 'rejected' ) {
        return null
    }

    if ( canModerateSite !== true ) {
        return (
            <span className="moderate-for-site__flag" title={`Flagged for Site Moderators`}><FlagIcon /></span>
        )
    } else {
        return (
            <>
                <a href="" className="moderate-for-site__flag" title={`Moderate for Site`} onClick={(e) => { e.preventDefault(); setShowModal(true) }}><FlagIcon /></a>
                <ModerateForSiteModal siteModerationId={siteModerationId} isVisible={showModal} setIsVisible={setShowModal} />
            </>
        )
    }

} 

export default ModerateForSite
