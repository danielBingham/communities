import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { postUsers } from '/state/User'
import { postGroupMembers } from '/state/GroupMember'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroup } from '/lib/hooks/Group'

import { TextBox } from '/components/ui/TextBox'
import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'

import { RequestErrorModal } from '/components/errors/RequestError'

import './InviteUsersForm.css'

const InviteUsersForm = function({ groupId }) {
    const [list, setList] = useState('')

    const [request, makeRequest] = useRequest()
    const [groupMemberRequest, makeGroupMemberRequest] = useRequest()

    const [group, groupRequest] = useGroup(groupId)

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
            if ( groupId ) {
                console.log(request)
                const users = request.response.body.relations.users
                const groupMembers = []
                for(const [id, user] of Object.entries(users)) {
                    groupMembers.push({
                        groupId: groupId,
                        userId: id,
                        status: 'pending-invited',
                        role: 'member'
                    })
                }
                makeGroupMemberRequest(postGroupMembers(groupId, groupMembers))
            } else {
                setList('')
                navigate('/friends/invited')
            }
        }
    }, [ request ])

    useEffect(function() {
        if ( groupMemberRequest?.state === 'fulfilled' ) {
            setList('')
            navigate(`/group/${group.slug}/members/email-invitations`)
        }
    }, [ groupMemberRequest ])

    if ( groupId !== null && groupId !== undefined && ! group ) {
        return (
            <Spinner />
        )
    }

    let placeholder = `Enter a comma separated list of email addresses for the friends you would like to invite. Eg. john.doe@gmail.com, jane.doe@hotmail.com, john.smith@mail.com, ...`
    if ( group !== null ) {
        placeholder = `Enter a comma separated list of email addresses for the friends you would like to invite to ${group.title}. Eg. john.doe@gmail.com, jane.doe@hotmail.com, john.smith@mail.com, ...`
    }

    return (
        <div className="invite-users-form">
            <TextBox 
                placeholder={placeholder}
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
