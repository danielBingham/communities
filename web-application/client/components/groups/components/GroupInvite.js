import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers, postUsers, clearUserQuery } from '/state/User'
import { postGroupMembers } from '/state/GroupMember'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './GroupInvite.css'

const GroupInvite = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const userDictionary = useSelector((state) => state.User.dictionary)
    const userQuery = useSelector((state) => 'GroupInvite' in state.User.queries ? state.User.queries['GroupInvite'] : null)

    const [userId, setUserId] = useState(null)
    const [nameOrEmail, setNameOrEmail] = useState( userId && userId in userDictionary ? userDictionary[userId].name : '')

    // The index of the userQuery representing the currently highlighted
    // suggested user.
    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)
    
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
            makePostGroupMembersRequest(postGroupMembers(groupId, { groupId: groupId, userId: userId, status: 'pending-invited', role: 'member' }))
            setNameOrEmail('')
            setUserId(null)
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
                makeGetUsersRequest(getUsers('GroupInvite', { name: name, isFriend: true, isNotGroupMember: groupId }))
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
        } 
        
        if ( ! isEmail(value) ) {
            suggestUsers(value)
        } else {
            clearSuggestions()
        }
    }

    const onKeyDown = function(event) {
        if ( event.key == 'Enter' ) {
            event.preventDefault()
            if ( userQuery !== null && userQuery.list.length > 0 ) {
                selectSuggestion(highlightedSuggestion)
            } else {
                invite()
            }
        } else if ( event.key == 'ArrowDown' ) {
            event.preventDefault()
            if ( highlightedSuggestion + 1 < userQuery.list.length ) {
                setHighlightedSuggestion(highlightedSuggestion+1)
            } else {
                setHighlightedSuggestion(userQuery.list.length-1)
            }
        } else if ( event.key == 'ArrowUp' ) {
            event.preventDefault()
            if ( highlightedSuggestion-1 <= 0 ) {
                setHighlightedSuggestion(0)
            } else {
                setHighlightedSuggestion(highlightedSuggestion-1)
            }
        } else if ( event.key == 'Escape' ) {
            event.preventDefault()
            clearSuggestions()
        }
    }

    const selectSuggestion = (index) => {
        const user = userDictionary[userQuery.list[index]]

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
            makePostGroupMembersRequest(postGroupMembers(groupId, { groupId: groupId, userId: invitedUser.id, status: 'pending-invited', role: 'member'}))
            setNameOrEmail('')
            setUserId(null)
        }
    }, [ postUsersRequest ])

    const suggestionRef = useRef(null)
    useEffect(function() {
        const onBodyClick = function(event) {
            if (suggestionRef.current && ! suggestionRef.current.contains(event.target) ) {
                clearSuggestions()
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ suggestionRef ])


    // Construct the suggestions list.
    const userSuggestions = []
    if ( userQuery ) {
        for(let index = 0;  index < userQuery.list.length; index++) {
            const id = userQuery.list[index]
            const user = userDictionary[id]
            userSuggestions.push(
                <a key={user.username} 
                    id={user.id} 
                    className={index === highlightedSuggestion ? "suggestion highlight" : "suggestion"} 
                    onClick={(e) => { e.preventDefault(); selectSuggestion(index) }}
                >
                    { user.name }
                </a>
            )
        }
    }

    const isPending = (postUsersRequest && postUsersRequest.state == 'pending') || (postGroupMembersRequest && postGroupMembersRequest.state == 'pending')

    let result = null
    if ( postGroupMembersRequest && postGroupMembersRequest.state === 'fulfilled' ) {
        result = (<span>Invitation sent!</span>)
    }
    return (
        <div className="group-invite">
            <div className="group-invite__input-wrapper">
                <div className="group-invite__suggestions-wrapper">
                    <input
                        type="text"
                        name="nameOrEmail"
                        value={nameOrEmail}
                        placeholder="Name or email of the person you want to invite..."
                        autoComplete="off"
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                    />
                    { userSuggestions.length > 0 && <div className="group-invite__suggestions" ref={suggestionRef}>
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
