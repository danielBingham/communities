import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { GlobeAltIcon, LockOpenIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'

import * as shared from '@communities/shared'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { useGroup } from '/lib/hooks/Group'
import { useFile } from '/lib/hooks/File'

import { patchGroup } from '/state/Group'

import DraftProfileImage from '/components/files/DraftProfileImage'
import FileUploadInput from '/components/files/FileUploadInput'

import AreYouSure from '/components/AreYouSure'
import Button from '/components/ui/Button'
import TextBox from '/components/generic/text-box/TextBox'
import Input from '/components/ui/Input'
import Spinner from '/components/Spinner'
import { RequestErrorModal } from '/components/errors/RequestError'

import './GroupEditForm.css'

const schema = new shared.schema.GroupSchema()

const GroupEditForm = function({ groupId }) {
    const hasRules = useFeature('issue-330-group-short-description-and-rules')

    const [group] = useGroup(groupId)

    const [areYouSure, setAreYouSure] = useState(false)

    const [ title, setTitle ] = useLocalStorage('group.draft.title', ( group?.title ? group.title : ''))
    const [ about, setAbout ] = useLocalStorage('group.draft.about', ( group?.about ? group.about : ''))
    const [ shortDescription, setShortDescription ] = useLocalStorage('group.draft.shortDescription', (group?.shortDescription ? group.shortDescription: ''))
    const [ rules, setRules ] = useLocalStorage('group.draft.rules', (group?.rules ? group.rules : ''))
    const [ fileId, setFileId] = useLocalStorage('group.draft.fileId', ( group?.fileId ? group.fileId : null))
    const [fileState, setFileState] = useState(null) 
    const [file] = useFile(fileId)

    const [ titleErrors, setTitleErrors ] = useState(null)
    const [ aboutErrors, setAboutErrors ] = useState(null)
    const [ shortDescriptionErrors, setShortDescriptionErrors ] = useState(null)
    const [ rulesErrors, setRulesErrors ] = useState(null)

    const [request, makeRequest] = useRequest()

    const fileRef = useRef(null)

    const navigate = useNavigate()

    const isDirty = function() {
        // If the group hasn't loaded yet, then we're not dirty yet.
        if ( ! group ) {
            return false
        }

        if ( title !== group.title ) {
            return true
        }  else if ( about !== group.about ) {
            return true
        } else if ( shortDescription !== group.shortDescription ) {
            return true
        } else if ( rules !== group.rules ) {
            return true
        } else if ( fileId !== group.fileId ) {
            return true
        }

        return false
    }

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

        let titleValidationErrors = []
        if ( ! field || field === 'title' ) {
            titleValidationErrors = schema.properties.title.validate(title)
            if ( titleValidationErrors.length > 0 ) {
                setTitleErrors(titleValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setTitleErrors(null)
            }
        }

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
            title: title,
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

    /**
     * Execute the cancelling of this Group edit and clear the form.
     */
    const cancel = function(event) {
        setTitle(null)
        setAbout(null)
        setShortDescription(null)
        setRules(null)
        setFileId(null)

        setAreYouSure(false)

        navigate(`/group/${group.slug}`)
    }

    /**
     * Handle the triggering of the 'cancel' action.
     */
    const handleCancel = function() {
        if ( isDirty() ) {
            setAreYouSure(true)
        } else {
            cancel()
        }
    }

    useEffect(() => {
        if ( fileId !== null && fileState == 'fulfilled' && ! request ) {
            makeRequest(patchGroup(assembleGroup()))
        } else if ( (fileState == 'fulfilled') && (request && request.state == 'fulfilled')) {
            setTitle(null)
            setAbout(null)
            setShortDescription(null)
            setRules(null)
            setFileId(null)
   
            navigate(`/group/${request.response.body.entity.slug}`)
        } else if ( fileId === null && (request && request.state == 'fulfilled')) {
            setTitle(null)
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
        <div className="group-edit-form">
            <form onSubmit={onSubmit} >
                <div className="group-edit-form__errors">{ baseError }</div>
                <div className="group-edit-form__group-image">
                    <div>
                        { ! fileId && <UserCircleIcon className="placeholder" /> }
                        { fileId && file?.state === 'ready' && <DraftProfileImage 
                            ref={fileRef}
                            fileId={fileId} 
                            setFileId={setFileId} 
                            state={fileState}
                            setState={setFileState}
                            width={200} 
                            deleteOnRemove={false} 
                        /> }
                        { ( ! fileId || file?.state !== 'ready') && <FileUploadInput 
                            fileId={fileId}
                            setFileId={setFileId} 
                            type="image"
                            types={[ 'image/jpeg', 'image/png' ]} 
                        /> }
                    </div>
                </div>
                <Input
                    name="title"
                    label="Title"
                    type="text"
                    explanation="Update this group's title. Members will be notified of the change."
                    value={title}
                    className="title"
                    onBlur={ (event) => validate('title') }
                    onChange={(e) => setTitle(e.target.value)} 
                    error={titleErrors}
                />
                { hasRules && 
                    <TextBox
                        name="shortDescription"
                        className="short-description"
                        label="Short Description"
                        explanation={`Update the short description for the group. Must be no longer than 150 characters.  This description will be used in the Group Badge on the search page and on the Group Profile Page.`}
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
                    explanation={`Update the full description of this group.  This should include a description of the group's purpose and what sort of content is appropriate for it. You can outline the group's rules in a separate field below.`}
                    value={about}
                    onChange={(event) => setAbout(event.target.value)}
                    error={aboutErrors}
                />
                { hasRules && 
                    <TextBox
                        name="rules"
                        className="rules"
                        label="Rules"
                        explanation={`Update the rules for this group. The rules should clearly describe the content and behavior that are not allowed and will be moderated.`}
                        value={rules}
                        onBlur={ (event) => validate('rules') }
                        onChange={(event) => setRules(event.target.value)}
                        error={rulesErrors}
                    />
                }
                <div className="group-edit-form__controls">
                    { inProgress && <Spinner /> }
                    { ! inProgress && <div className="buttons">
                        <Button onClick={() => handleCancel()}>Cancel</Button> 
                        <input type="submit" name="submit" value="Submit" />
                    </div> }
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
            <RequestErrorModal request={request} message={"Edit Group"} />
        </div>
    )

}

export default GroupEditForm
