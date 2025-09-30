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
import logger from '/logger'

import { deleteAuthentication } from '/state/authentication'

import { useRequest } from '/lib/hooks/useRequest'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import Button from '/components/ui/Button'

import './AgeGate.css'

const AgeGate = function() {
    const [request, makeRequest] = useRequest()

    const logout = function() {
        // Clear local storage so their drafts don't carry over to another
        // login session.
        localStorage.clear()

        makeRequest(deleteAuthentication())
    }

    return (
        <div id="age-gate">
            <div className="logo"><CommunitiesLogo /></div>
            <p>You must be at least 18 years of age to use Communities.</p>
            <p>When you turn 18 years old, you will be able to use your Communities account.</p>
            <p><Button type='warn' onClick={() => logout()}>Log out</Button></p>
        </div>
    )

}

export default AgeGate
