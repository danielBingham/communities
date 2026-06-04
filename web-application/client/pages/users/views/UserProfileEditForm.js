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
import { useState, useEffect, useRef }  from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useFile } from '/lib/hooks/File'
import { validateName, validateAbout } from '/lib/validation/user'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import { patchUser } from '/state/User'
import { removeRequest } from '/state/requests'
import { removeRequest as removeFileRequest } from '/state/File'

import DraftProfileImage from '/components/files/DraftProfileImage'
import FileUploadInput from '/components/files/FileUploadInput'

import { RequestErrorModal } from '/components/errors/RequestError'

import AreYouSure from '/components/AreYouSure'
import Input from '/components/ui/Input'
import TextBox from '/components/generic/text-box/TextBox'
import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'

import './UserProfileEditForm.css'

const UserProfileEditForm = function(props) {

    const currentUser = useSelector((state) =>  state.authentication.currentUser)

    const [areYouSure, setAreYouSure] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const [fileId, setFileId] = useState(null)

    const [name, setName] = useState('')
    const [about, setAbout] = useState('')

    const [nameError, setNameError] = useState(null)
    const [aboutError, setAboutError] = useState(null)
    
    const fileRef = useRef(null)

    const uploadRequests = useSelector((state) => state.File.requests)
    const [ request, makeRequest, resetRequest ] = useRequest()

    const madeChange = fileId != currentUser.fileId || name != currentUser.name || about != currentUser.about

    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const isDirty = function() {
        if ( ! currentUser ) {
            return false
        }

        if ( fileId !== currentUser.fileId ) {
            return true
        } else if ( name !== currentUser.name ) { 
            return true
        } else if ( about !== currentUser.about ) {
            return true
        }

        return false
    }


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

    const cleanupRequest = function() {
        if ( fileId in uploadRequests ) {
            dispatch(removeRequest({ id: uploadRequests[fileId] }))
            dispatch(removeFileRequest({ fileId: fileId }))
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

    const updateUser = function() {
        makeRequest(patchUser(assembleUser()))
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        setIsPending(true)

        cleanupRequest()

        if ( fileId !== null && fileId !== undefined ) {
            fileRef.current?.submit()
        } else {
            updateUser() 
        }
    }


    /**
     * Execute the cancelation of this user profile edit and clear the form.
     */
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

        setIsPending(false)
        setAreYouSure(false)
        
        cleanupRequest()

        navigate(`/${currentUser.username}`)
    }

    /**
     * Handle the 'cancel' user action.
     */
    const handleCancel = function() {
        if ( isDirty() ) {
            setIsPending(false)
            setAreYouSure(true)
        } else {
            cancel()
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

    // Reset the request if a change has been made.
    useEffect(function() {
        if ( madeChange === true ) {
            resetRequest()
        }
    }, [ madeChange ])

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            setIsPending(false)
            navigate(`/${currentUser.username}`)
        } else if ( request?.state === 'failed' ) {
            setIsPending(false)
        }
    }, [ request ])


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
                Request failed: { request.error.message }.
            </div>
        )
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
                                        width={200} 
                                        deleteOnRemove={false} 
                                        onProcessingSuccess={() => { setIsPending(false) }}
                                        onCropSuccess={() => { updateUser() }}
                                        onError={() => { setIsPending(false)}}
                                        onRemove={() => { setIsPending(false)}}
                                        
                        /> }
                        { ( ! fileId ) && <FileUploadInput 
                            maxFiles={1}
                            onChange={(fileIds) => { setIsPending(true); setFileId(fileIds[0])}} 
                            kind="image"
                            allowedTypes={[ 'image/jpeg', 'image/png' ]} 
                        /> }
                    </div>
                </div>
                <Input
                    name="name"
                    type="text"
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
                    {result}
                </div>
                <div className="form-submit submit">
                    { ! isPending && <span><Button onClick={(e) => handleCancel()}>Cancel</Button> <input type="submit" name="submit" value="Submit" /></span> }
                    { isPending && <div><Spinner /><p>Updating. Do not navigate away...</p></div> }
                </div>
            </form>
            <AreYouSure 
                isVisible={areYouSure} 
                cancelLabel="Keep Editing"
                executeLabel="Discard Changes"
                execute={cancel} 
                cancel={() => setAreYouSure(false)}
            >
                <p>Are you sure you want to discard your changes?</p>
            </AreYouSure>
        </div>
    )
}

export default UserProfileEditForm
