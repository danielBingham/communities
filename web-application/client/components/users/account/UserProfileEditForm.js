import React, { useState, useEffect, useLayoutEffect }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import { patchUser, cleanupRequest } from '/state/users'

import FileUploadInput from '/components/files/FileUploadInput'
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
                setNameError('no-name')
                error = true
            } else if ( name.length > 500 ) {
                setNameError('too-long')
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
            setAboutError('length')
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

    let nameErrorView = null

    if ( nameError && nameError == 'no-name' ) {
        nameErrorView = ( <div className="error">Name is required!</div>)
    } else if ( nameError && nameError == 'too-long' ) {
        nameErrorView = ( <div className="error">Name is too long. Limit is 500 characters.</div> )
    }

    let aboutErrorView = null
    if ( aboutError == 'length' ) {
        aboutErrorView = ( <div className="error">About is too long.  Limit is 250 characters.</div> )
    }

    return (
        <div className='user-profile-edit-form'>
            <form onSubmit={onSubmit}>
                <div className="form-field profile-image">
                    <label></label>
                    <div>
                        <FileUploadInput 
                            fileId={fileId}
                            setFileId={setFileId} 
                            types={[ 'image/jpeg', 'image/png' ]} 
                            blankImage={ <UserCircleIcon className="image" />}
                            width={200}
                        />
                    </div>
                </div>
                <div className="form-field name">
                    <label htmlFor="name">Name</label><input type="text"
                        name="name"
                        value={name}
                        onBlur={(event) => isValid('name')}
                        onChange={(event) => setName(event.target.value)}
                    />
                    { nameErrorView }
                </div>
                <div className="form-text about">
                    <label htmlFor="about">About You</label>
                    <textarea name="about" 
                        value={about} 
                        onChange={onAboutChange}
                    ></textarea>
                    { aboutErrorView }
                </div>
                <div className="result">{result}</div>
                <div className="form-submit submit">
                    { submit }
                </div>
            </form>
        </div>
    )
}

export default UserProfileEditForm
