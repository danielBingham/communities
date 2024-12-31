import React, { useState, useEffect, useLayoutEffect }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import { patchUser, cleanupRequest } from '/state/users'

import UserProfileImage from '/components/users/UserProfileImage'
import DraftImageFile from '/components/files/DraftImageFile'
import FileUploadInput from '/components/files/FileUploadInput'

import Input from '/components/generic/input/Input'
import TextBox from '/components/generic/text-box/TextBox'
import Spinner from '/components/Spinner'

import './UserProfileEditForm.css'

const UserProfileEditForm = function(props) {

    // ======= Render State =========================================

    const [fileId, setFileId] = useState(null)
    const [name, setName] = useState('')
    const [about, setAbout] = useState('')

    const [nameError, setNameError] = useState(null)
    const [aboutError, setAboutError] = useState(null)
    
    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const isValid = function(field) {
        let error = false

        if ( ! field || field == 'name' ) {
            if ( name.length <= 0 ) {
                setNameError("Name is required!")
                error = true
            } else if ( name.length > 500 ) {
                setNameError("Name is too long. Limit is 500 characters.")
                error = true
            } else {
                setNameError(null)
            }
        }

        if ( ! field || field == 'about' ) {
            if ( about.length > 500 ) {
                setAboutError('length')
                error = true
            } else {
                setAboutError(null)
            }
        }


        return ! error
    }

    const onAboutChange = function(event) {
        const newContent = event.target.value
        if ( newContent.length > 250) {
            setAboutError('About is too long.  Limit is 250 characters.')
        } else {
            setAboutError('')
            setAbout(newContent)
        }

    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        const user = { 
            id: currentUser.id,
            fileId: fileId,
            name: name,
            about: about
        }

        setRequestId(dispatch(patchUser(user)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( ! currentUser.name ) {
            setName('')
        } else {
            setName(currentUser.name)
        } 

        if ( ! currentUser.about ) {
            setAbout('')
        } else {
            setAbout(currentUser.about)
        }

        if ( ! currentUser.fileId ) {
            setFileId(null)
        } else {
            setFileId(currentUser.fileId)
        }
    }, [])

    // Clean up request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
   
    let result = null
    if ( request && request.state == 'fulfilled' ) {
        result = (
            <div className="success">
                Update successful.
            </div>
        )
    } else if ( request && request.state == 'failed') {
        result = (
            <div className="request-failure">
                Request failed: { request.error }.
            </div>
        )
    }

    let submit = ( <input type="submit" name="submit" value="Submit" /> )
    if ( request && request.state == 'pending') {
        submit = ( <Spinner /> )
    }

    return (
        <div className='user-profile-edit-form'>
            <form onSubmit={onSubmit}>
                <div className="profile-image">
                    <div>
                        { ! fileId && <div className="current-image"><UserProfileImage userId={currentUser.id} /></div> }
                        { fileId && <DraftImageFile fileId={fileId} setFileId={setFileId} width={150} /> }
                        { ! fileId && <FileUploadInput 
                            fileId={fileId}
                            setFileId={setFileId} 
                            types={[ 'image/jpeg', 'image/png' ]} 
                        /> }
                    </div>
                </div>
                <Input
                    name="name"
                    label="Name"
                    explanation={`Your display name. We strongly encourage you
                    to use your real name, but we don't enforce this.`}
                    className="name"
                    value={name}
                    onBlur={(event) => isValid('name')}
                    onChange={(event) => setName(event.target.value)}
                    error={nameError}
                />
                <TextBox
                    name="about"
                    className="about"
                    label="About You"
                    explanation={`A short bio to display with your profile.  Limited to 250 characters.`}
                    value={about}
                    onChange={onAboutChange}
                    error={aboutError}
                />
                <div className="result">{result}</div>
                <div className="form-submit submit">
                    { submit }
                </div>
            </form>
        </div>
    )
}

export default UserProfileEditForm
