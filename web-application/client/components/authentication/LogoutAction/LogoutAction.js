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
import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'
import { deleteAuthentication } from '/state/authentication'

import { RequestErrorModal } from '/components/errors/RequestError'

import Button from '/components/ui/Button'

import "./LogoutAction.css"

const LogoutAction = function({ type, text }) {
    const [ request, makeRequest ] = useRequest()

    const logout = function() {
        // Clear local storage so their drafts don't carry over to another
        // login session.
        localStorage.clear()

        makeRequest(deleteAuthentication())
    }

    let actionText = text ? text : 'Logout'
    if ( type === 'button' ) {
        return (
            <>
                <Button type="warn" onClick={() => logout()}><ArrowLeftStartOnRectangleIcon /> { actionText }</Button>
                <RequestErrorModal message="Attempt to logout" request={request} />
            </>
        )
    } else {
        return (
            <>
                <a href="" onClick={(e) => { e.preventDefault(); logout() }}><ArrowLeftStartOnRectangleIcon /> { actionText }</a>
                <RequestErrorModal message="Attempt to logout" request={request} />
            </>
        )
    }

}

export default LogoutAction
