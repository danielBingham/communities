import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { GlobeAltIcon, LockOpenIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'

import { useGroup } from '/lib/hooks/Group'

import { patchGroup } from '/state/Group'

import DraftProfileImage from '/components/files/DraftProfileImage'
import FileUploadInput from '/components/files/FileUploadInput'

import Button from '/components/generic/button/Button'
import TextBox from '/components/generic/text-box/TextBox'
import Spinner from '/components/Spinner'

import './GroupEditForm.css'

const GroupEditForm = function({ groupId }) {

    const [group] = useGroup(groupId)

    const [ about, setAbout ] = useLocalStorage('group.draft.about', ( group?.about ? group.about : ''))
    const [ fileId, setFileId] = useLocalStorage('group.draft.fileId', ( group?.fileId ? group.fileId : null))
    const [fileState, setFileState] = useState(null) 

    const [ aboutErrors, setAboutErrors ] = useState([])

    const [request, makeRequest] = useRequest()

    const fileRef = useRef(null)

    const validate = function(field) {

        let aboutValidationErrors = []
        if ( ! field || field == 'about' ) {
            if ( about.length >= 10000) {
                aboutValidationErrors.push('About must be less than 10,000 characters.')
            }
            setAboutErrors(aboutValidationErrors)
        }

        return  aboutValidationErrors == 0 
    }

    const assembleGroup = function() {
        return {
            id: groupId,
            about: about,
            fileId: fileId
        }
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! validate() ) {
            return
        }

        if ( fileId !== null && fileId !== undefined ) {
            fileRef.current?.submit()
        } else {
            makeRequest(patchGroup(assembleGroup()))
        }
    }

    const cancel = function(event) {
        setAbout(null)
        setFileId(null)

        navigate(`/group/${group.slug}`)
    }

    const navigate = useNavigate()
    useEffect(() => {
        if ( fileId !== null && fileState == 'fulfilled' && ! request ) {
            makeRequest(patchGroup(assembleGroup()))
        } else if ( (fileState == 'fulfilled') && (request && request.state == 'fulfilled')) {
            setAbout(null)
            setFileId(null)
   
            navigate(`/group/${request.response.body.entity.slug}`)
        } else if ( fileId === null && (request && request.state == 'fulfilled')) {
            setAbout(null)
            setFileId(null)
   
            navigate(`/group/${request.response.body.entity.slug}`)
        }
    }, [ request, fileState, fileId ])

    if ( ! group ) {
        return (<Spinner />)
    }

    let baseError = null
    let aboutError = aboutErrors.join(' ')

    const inProgress = (request && request.state == 'pending') || (fileId && fileState == 'pending')
    return (
        <form onSubmit={onSubmit} className="group-edit-form">
            <div className="group-edit-form__errors">{ baseError }</div>
            <div className="group-edit-form__group-image">
                <div>
                    { ! fileId && <UserCircleIcon className="placeholder" /> }
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
            <TextBox
                name="about"
                className="about"
                label="About"
                explanation={`Enter a description of this group.  This should include a description of the group's purpose, it's rules, and what sort of content is appropriate for this group.`}
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                error={aboutError}
            />
            <div className="group-edit-form__controls">
                { inProgress && <Spinner /> }
                { ! inProgress && <div className="buttons">
                    <Button onClick={(e) => cancel()}>Cancel</Button> 
                    <input type="submit" name="submit" value="Submit" />
                </div> }
            </div>
        </form>
    )

}

export default GroupEditForm
