import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers, postUsers, clearUserQuery } from '/state/users'
import { postGroupMembers } from '/state/groupMembers'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './GroupInvite.css'

const GroupInvite = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const userDictionary = useSelector((state) => state.users.dictionary)
    const userQuery = useSelector((state) => 'GroupInvite' in state.users.queries ? state.users.queries['GroupInvite'] : null)

    const [userId, setUserId] = useState(null)
    const [nameOrEmail, setNameOrEmail] = useState( userId && userId in userDictionary ? userDictionary[userId].name : '')
    
    const [getUsersRequest, makeGetUsersRequest] = useRequest()
    const [postUsersRequest, makePostUsersRequest] = useRequest()
    const [postGroupMembersRequest, makePostGroupMembersRequest] = useRequest()


    const dispatch = useDispatch()
    const timeoutId = useRef(null)

    const isEmail = (value) => {
        const trimmed = value.trim()
        return trimmed.match(/\S*@\S*/) !== null
    }

    const invite = () => {
        if ( userId ) {
            makePostGroupMembersRequest(postGroupMembers({ groupId: groupId, userId: userId }))
        } else if ( isEmail(nameOrEmail)) {
            makePostUsersRequest(postUsers({ email: nameOrEmail.trim(), groupId: groupId})) 
        }
    }

    /**
     * Clear the suggestions list.
     */
    const clearSuggestions = function() {
        dispatch(clearUserQuery({ name: 'GroupInvite'}))
    }

    /**
     * Query the backend for a list of suggested users matching the given name.
     *
     * @param {string} name The name or partial name of the user we want to
     * query for.
     */
    const suggestUsers = function(name) {
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( name.length > 0) {
                clearSuggestions()
                makeGetUsersRequest(getUsers('GroupInvite', { name: name, isFriend: true}))
            } 
        }, 250)
    }

    const onChange = (event) => {
        const value = event.target.value
        setNameOrEmail(value)

        // We don't want to make a new request until they've stopped typing,
        // but we don't want to show old data before the request runs.
        if ( value.length <= 0 ) {
            clearSuggestions()
            setUserId(null)
        } else if ( userId && value !== userDictionary[userId].name ) {
            setUserId(null)
        }
        
        if ( ! isEmail(value) ) {
            suggestUsers(value)
        } else {
            clearSuggestions()
        }
    }

    const selectSuggestion = (event, user) => {
        event.preventDefault()

        setUserId(user.id)
        setNameOrEmail(user.name)
        clearSuggestions()
    }

    useEffect(() => {
        if ( postUsersRequest && postUsersRequest.state === 'fulfilled' ) {
            const userDictionary = postUsersRequest.response.body.relations.users
            let invitedUser = null
            for(const [id, user] of Object.entries(userDictionary)) {
                if ( user.email === nameOrEmail ) {
                    invitedUser = user
                }
            }
            if ( invitedUser === null ) {
                throw new Error('Failed to find invited user after invitation!')
            }
            makePostGroupMembersRequest(postGroupMembers({ groupId: groupId, userId: invitedUser.id}))
            setNameOrEmail('')
        }
    }, [ postUsersRequest ])

    const userSuggestions = []
    if ( userQuery ) {
        for(const id of userQuery.list) {
            const user = userDictionary[id]
            userSuggestions.push(<a key={user.username} className="suggestion" onClick={(e) => selectSuggestion(e, user)}>{ user.name }</a>)
        }
    }

    const isPending = (postUsersRequest && postUsersRequest.state == 'pending') || (postGroupMembersRequest && postGroupMembersRequest.state == 'pending')

    let result = null
    if ( postGroupMembersRequest && postGroupMembersRequest.state === 'fulfilled' ) {
        result = (<span>Invitation sent!</span>)
    }
    return (
        <div className="group-invite">
            <div className="group-invite__invitations">Beta: You have {currentUser.invitations} invitations left.</div>
            <div className="group-invite__input-wrapper">
                <div className="group-invite__suggestions-wrapper">
                    <input
                        type="text"
                        name="nameOrEmail"
                        value={nameOrEmail}
                        placeholder="Name or email of the person you want to invite..."
                        onChange={onChange}
                    />
                    { userSuggestions.length > 0 && <div className="group-invite__suggestions">
                        { userSuggestions }
                    </div> }
                </div>
                { isPending && <Spinner /> }
                { ! isPending && <Button type="primary" onClick={invite}>Send Invite</Button> }
            </div>
            <div className="result">{ result }</div>
        </div>

    )

}

export default GroupInvite
