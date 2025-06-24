import React, { useState, useEffect, useRef }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { validateName, validateAbout } from '/lib/validation/user'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import { patchUser } from '/state/User'

import UserProfileImage from '/components/users/UserProfileImage'
import DraftProfileImage from '/components/files/DraftProfileImage'
import FileUploadInput from '/components/files/FileUploadInput'

import Input from '/components/generic/input/Input'
import TextBox from '/components/generic/text-box/TextBox'
import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './UserProfileEditForm.css'

const UserProfileEditForm = function(props) {

    // ======= Render State =========================================

    const [fileId, setFileId] = useState(null)
    const [fileState, setFileState] = useState(null)

    const [name, setName] = useState('')
    const [about, setAbout] = useState('')

    const [nameError, setNameError] = useState(null)
    const [aboutError, setAboutError] = useState(null)
    
    const fileRef = useRef(null)

    // ======= Request Tracking =====================================

    const [ request, makeRequest, resetRequest ] = useRequest()

    // ======= Redux State ==========================================

    const currentUser = useSelector((state) =>  state.authentication.currentUser)

    const madeChange = fileId != currentUser.fileId || name != currentUser.name || about != currentUser.about

    // ======= Actions and Event Handling ===========================

    const isValid = function(field) {
        let error = false

        if ( ! field || field == 'name' ) {
            const nameValidationErrors = validateName(name)
            if ( nameValidationErrors.length > 0 ) {
                setNameError(nameValidationErrors.join(' '))
                error = true
            } else {
                setNameError(null)
            }
        }

        if ( ! field || field == 'about' ) {
            const aboutValidationErrors = validateAbout(about)
            if ( aboutValidationErrors.length > 0 ) {
                setAboutError(aboutValidationErrors.join(' '))
                error = true
            } else {
                setAboutError(null)
            }
        }

        return ! error
    }

    const onAboutChange = function(event) {
        const newContent = event.target.value
        const aboutValidationErrors = validateAbout(newContent)
        if ( aboutValidationErrors.length > 0) {
            setAboutError(aboutValidationErrors.join(' '))
        } else {
            setAboutError('')
            setAbout(newContent)
        }
    }

    const assembleUser = function() {
        return {
            id: currentUser.id,
            fileId: fileId,
            name: name,
            about: about
        }
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        if ( fileId !== null && fileId !== undefined ) {
            fileRef.current?.submit()
        } else {
            makeRequest(patchUser(assembleUser()))
        }
    }

    const cancel = function() {
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

    useEffect(function() {
        if ((fileId !== null && fileState === 'fulfilled') && ! request ) 
        {
            makeRequest(patchUser(assembleUser()))
        }
    }, [ fileId, fileState ])

    // Reset the request if a change has been made.
    useEffect(function() {
        if ( madeChange === true ) {
            resetRequest()
        }
    }, [ madeChange ])

    // ======= Render ===============================================
   
    let result = null
    if ( fileId && fileState == 'fulfilled' && request && request.state == 'fulfilled' ) {
        result = (
            <div className="success">
                Update successful.
            </div>
        )
    } else if ( request && request.state == 'failed') {
        result = (
            <div className="request-failure">
                Request failed: { request.error.message }.
            </div>
        )
    } else if ( fileId && fileState == 'failed' ) {
        result = (
            <div className="request-failure">
                Request failed. Failed to crop your profile image.
            </div>
        )
    }

    let submit = ( <><Button onClick={(e) => cancel()}>Cancel</Button> <input type="submit" name="submit" value="Submit" /></> )
    if ( (request && request.state == 'pending' ) || ( fileId && fileState == 'pending' )) {
        submit = ( <Spinner /> )
    }

    return (
        <div className='user-profile-edit-form'>
            <form onSubmit={onSubmit}>
                <div className="user-profile-edit-form__profile-image">
                    <div>
                        { ! fileId && <UserCircleIcon className="user-profile-edit-form__placeholder" /> }
                        { fileId && <DraftProfileImage
                                        ref={fileRef}
                                        fileId={fileId} 
                                        setFileId={setFileId} 
                                        state={fileState}
                                        setState={setFileState}
                                        width={200} 
                                        deleteOnRemove={false} 
                        /> }
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
                <div className="result">
                    { madeChange && <span>Submit to save your changes...</span> }
                    {result}
                </div>
                <div className="form-submit submit">
                    { submit }
                </div>
            </form>
        </div>
    )
}

export default UserProfileEditForm
