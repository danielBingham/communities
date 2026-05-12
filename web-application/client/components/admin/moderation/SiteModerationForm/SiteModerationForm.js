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

import can, {Actions, Entities} from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'

import { useSiteModeration } from '/lib/hooks/SiteModeration'

import { patchSiteModeration } from '/state/SiteModeration'

import TextBox from '/components/generic/text-box/TextBox'
import Button from '/components/ui/Button'
import { RequestErrorModal } from '/components/errors/RequestError'

import './SiteModerationForm.css'

const SiteModerationForm = function({ siteModerationId }) {
    const [reason, setReason] = useState('')

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [moderation, moderationRequest, reload] = useSiteModeration(siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const [request, makeRequest] = useRequest()

    const moderate = function(status) {
            const patch = {
                id: moderation.id,
                userId: currentUser.id,
                status: status,
                reason: reason,
            }
        
            makeRequest(patchSiteModeration(patch))
    }

    if ( canModerateSite !== true ) {
        return null
    }

    if ( (moderation === undefined || moderation === null) 
        && ( moderationRequest === null || moderationRequest?.state === 'pending' ) )
    {
        return null
    }

    if ( moderation === undefined || moderation === null ) {
        return (
            <div className="site-moderation-form">
                <div className="site-moderation-form__not-found">
                    <p>Moderation not found.</p>
                    <Button type="warning" onClick={() => reload()}>Retry</Button>
                </div>
            </div>
        )
    }


    return (
        <div className="site-moderation-form">
            <TextBox
                name="reason"
                className="site-moderation-form__reason"
                label="Moderation Reason (Optional)"
                explanation={`Optionally enter a short explanation for your moderation decision.`}
                value={reason}
                onChange={(e) => { setReason(e.target.value)}}
            />
            <div className="site-moderation-form__buttons">
                <Button type="warn" onClick={() => moderate('rejected')}>Reject</Button>
                <Button type="success" onClick={() => moderate('approved')}>Approve</Button>
            </div>
            <RequestErrorModal message="Attempt to moderate" request={request} /> 
        </div>
    )


}

export default SiteModerationForm
