import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { postUsers } from '/state/User'

import { useRequest } from '/lib/hooks/useRequest'

import { TextBox } from '/components/ui/TextBox'
import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'

import { RequestErrorModal } from '/components/errors/RequestError'

import './InviteUsersForm.css'

const InviteUsersForm = function() {
    const [list, setList] = useState('')

    const [request, makeRequest] = useRequest()

    const navigate = useNavigate()

    const sendInvitations = function() {
        const emails = list.split(',').map((e) => e.trim())
        const users = []
        for(const email of emails ) {
            users.push({
                email: email
            })
        }

        makeRequest(postUsers(users))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            setList('')
            navigate('/friends/invited')
        }
    }, [ request ])


    return (
        <div className="invite-users-form">
            <TextBox 
                placeholder="Enter a comma separated list of email addresses for the friends you would like to invite. Eg. john.doe@gmail.com, jane.doe@hotmail.com, john.smith@mail.com, ..."
                value={list}
                onChange={(e) => setList(e.target.value)} />
            { request?.state === 'fulfilled' && <div className="invite-users-form__success">Invites sent!</div> }
            <RequestErrorModal message="Some invitations" request={request} ignore404={true} />
            <div className="invite-users-form__buttons">
                { request?.state !== 'pending' && <Button type="primary" onClick={() => sendInvitations()}>Invite Friends</Button> }
                { request?.state === 'pending' && <Spinner /> }
            </div>
        </div>
    )
}

export default InviteUsersForm
