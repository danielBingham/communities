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
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { ArrowPathIcon } from '@heroicons/react/24/outline'

import { createToken } from '/state/tokens'

import { useRequest } from '/lib/hooks/useRequest'

import { RequestErrorModal } from '/components/errors/RequestError'

import Modal from '/components/generic/modal/Modal'
import Alert from '/components/ui/Alert'
import Button from '/components/ui/Button'

import './ResendTokenAction.css'

const ResendTokenAction = function({}) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [email, setEmail] = useState(currentUser ? currentUser.email : '')
    const [needEmail, setNeedEmail] = useState(false)

    const [ request, makeRequest ] = useRequest()


    const requestNewConfirmationEmail = function() {
        if ( email !== '' ) {
            setNeedEmail(false)
            makeRequest(createToken({ type: 'email-confirmation', email: email}))
        } else {
            setNeedEmail(true)
        }
    }

    useEffect(function() {
        if ( ( request?.state === 'failed' || request?.state === 'fulfilled' ) && ! currentUser ) {
            // Reset the email after the request completes to let them try again.
            if ( currentUser ) {
                setEmail(currentUser.email)
            } else {
                setEmail('')
            }
        }
    }, [ request ])

    return (
        <>
            { request?.state === 'fulfilled' && <Alert type="success" timeout={5000}>Confirmation email sent!</Alert> }
            <Button onClick={(e) => requestNewConfirmationEmail()}><ArrowPathIcon /> Resend</Button>
            <Modal isVisible={needEmail} setIsVisible={setNeedEmail} noClose={true} hideX={true}>
                <p>Please enter the email you registered with to recieve a new confirmation token.</p>
                <div className="resend-token-action__email-form">
                    <input
                        type="text"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button type="primary" onClick={() => requestNewConfirmationEmail()}><ArrowPathIcon /> Resend</Button>
                </div>
            </Modal>
            <RequestErrorModal message="Attempt to send new token" request={request} />
        </>
    )


}

export default ResendTokenAction
