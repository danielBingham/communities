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
import { useNavigate } from 'react-router-dom'

import Card from '/components/ui/Card'

import AcceptInvitationForm from '/components/authentication/AcceptInvitationForm'

import CommunitiesLogo from '/components/header/CommunitiesLogo'

import './AcceptInvitationPage.css'

const AcceptInvitationPage = function(props) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()
    useEffect(() => {
        if ( currentUser?.status !== 'invited' ) {
            navigate('/')
        }
    }, [ currentUser ])

    return (
        <div id="accept-invitation-page">
            <Card className="accept-invitation-page__card">
                <div className="logo"><CommunitiesLogo type="logo" /></div>
                <AcceptInvitationForm />
            </Card>
        </div>
    )

}

export default AcceptInvitationPage
