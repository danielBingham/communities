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

import { ArrowPathIcon } from '@heroicons/react/24/outline'

import { createToken } from '/state/tokens'

import { useRequest } from '/lib/hooks/useRequest'

import { RequestErrorModal } from '/components/errors/RequestError'

import Alert from '/components/ui/Alert'
import Button from '/components/ui/Button'

const ResendTokenAction = function({}) {
    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const requestNewConfirmationEmail = function() {
        makeRequest(createToken({ type: 'email-confirmation', email: currentUser.email}))
    }

    return (
        <>
            { request?.state === 'fulfilled' && <Alert type="success" timeout={5000}>Confirmation email sent!</Alert> }
            <Button onClick={(e) => requestNewConfirmationEmail()}><ArrowPathIcon /> Resend</Button>
            <RequestErrorModal message="Attempt to send new token" request={request} />
        </>
    )


}

export default ResendTokenAction
