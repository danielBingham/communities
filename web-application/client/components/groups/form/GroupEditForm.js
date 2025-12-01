import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { GlobeAltIcon, LockOpenIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'

import * as shared from '@communities/shared'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { useGroup } from '/lib/hooks/Group'

import { patchGroup } from '/state/Group'

import DraftProfileImage from '/components/files/DraftProfileImage'
import FileUploadInput from '/components/files/FileUploadInput'

import Button from '/components/generic/button/Button'
import TextBox from '/components/generic/text-box/TextBox'
import Spinner from '/components/Spinner'

import './GroupEditForm.css'

const schema = new shared.schema.GroupSchema()

const GroupEditForm = function({ groupId }) {
    const hasRules = useFeature('issue-330-group-short-description-and-rules')

    const [group] = useGroup(groupId)

    const [ about, setAbout ] = useLocalStorage('group.draft.about', ( group?.about ? group.about : ''))
    const [ shortDescription, setShortDescription ] = useLocalStorage('group.draft.shortDescription', (group?.shortDescription ? group.shortDescription: ''))
    const [ rules, setRules ] = useLocalStorage('group.draft.rules', (group?.rules ? group.rules : ''))
    const [ fileId, setFileId] = useLocalStorage('group.draft.fileId', ( group?.fileId ? group.fileId : null))
    const [fileState, setFileState] = useState(null) 

    const [ aboutErrors, setAboutErrors ] = useState([])
    const [ shortDescriptionErrors, setShortDescriptionErrors ] = useState(null)
    const [ rulesErrors, setRulesErrors ] = useState(null)

    const [request, makeRequest] = useRequest()

    const fileRef = useRef(null)

    const navigate = useNavigate()

    const validateShortDescription = function(value) {
        const shortDescriptionValidationErrors = schema.properties.shortDescription.validate(shortDescription)
        if ( shortDescriptionValidationErrors.length > 0 ) {
            setShortDescriptionErrors(shortDescriptionValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
        } else {
            setShortDescriptionErrors(null)
        }
        return shortDescriptionValidationErrors

    }

    const validate = function(field) {

        let aboutValidationErrors = []
        if ( ! field || field == 'about' ) {
            aboutValidationErrors = schema.properties.about.validate(about)
            if ( aboutValidationErrors.length > 0 ) {
                setAboutErrors(aboutValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setAboutErrors(null)
            }
        }

        let shortDescriptionValidationErrors = []
        if ( ! field || field === 'shortDescription' ) {
            shortDescriptionValidationErrors = validateShortDescription(shortDescription)
        }

        let rulesValidationErrors = []
        if ( ! field || field === 'rules' ) {
            rulesValidationErrors = schema.properties.rules.validate(rules)
            if ( rulesValidationErrors.length > 0 ) {
                setRulesErrors(rulesValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setRulesErrors(null)
            }
        }

        return  aboutValidationErrors == 0 
            && shortDescriptionValidationErrors.length === 0
            && rulesValidationErrors.length === 0
    }

    const assembleGroup = function() {
        const newGroup = {
            id: groupId,
            about: about,
            fileId: fileId
        }

        if ( hasRules === true ) {
            newGroup.shortDescription = shortDescription
            newGroup.rules = rules
        }

        return newGroup
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
        setShortDescription(null)
        setRules(null)
        setFileId(null)

        navigate(`/group/${group.slug}`)
    }

    useEffect(() => {
        if ( fileId !== null && fileState == 'fulfilled' && ! request ) {
            makeRequest(patchGroup(assembleGroup()))
        } else if ( (fileState == 'fulfilled') && (request && request.state == 'fulfilled')) {
            setAbout(null)
            setShortDescription(null)
            setRules(null)
            setFileId(null)
   
            navigate(`/group/${request.response.body.entity.slug}`)
        } else if ( fileId === null && (request && request.state == 'fulfilled')) {
            setAbout(null)
            setShortDescription(null)
            setRules(null)
            setFileId(null)
   
            navigate(`/group/${request.response.body.entity.slug}`)
        }
    }, [ request, fileState, fileId ])

    if ( ! group ) {
        return (<Spinner />)
    }

    let baseError = null

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
            { hasRules && 
                <TextBox
                    name="shortDescription"
                    className="short-description"
                    label="Short Description"
                    explanation={`Enter a short description for the group no longer than 150 characters.  This description will be used in the Group Badge on the search page and on the Group Profile Page.`}
                    value={shortDescription}
                    onBlur={ (event) => validate('shortDescription') }
                    onChange={(event) => { setShortDescription(event.target.value); validate('shortDescription') }}
                    error={shortDescriptionErrors}
                />
            }
            <TextBox
                name="about"
                className="about"
                label="About"
                explanation={`Enter the full description of this group.  This should include a description of the group's purpose and what sort of content is appropriate for it. You can outline the group's rules in a separate field below.`}
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                error={aboutErrors}
            />
            { hasRules && 
                <TextBox
                    name="rules"
                    className="rules"
                    label="Rules"
                    explanation={`Enter the rules for this group. The rules should clearly describe the content and behavior that are not allowed and will be moderated.`}
                    value={rules}
                    onBlur={ (event) => validate('rules') }
                    onChange={(event) => setRules(event.target.value)}
                    error={rulesErrors}
                />
            }
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
