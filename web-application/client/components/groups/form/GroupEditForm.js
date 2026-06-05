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
import React, { useRef, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { GlobeAltIcon, LockOpenIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'

import * as shared from '@communities/shared'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { useGroup } from '/lib/hooks/Group'
import { useFile } from '/lib/hooks/File'

import { patchGroup } from '/state/Group'
import { removeRequest } from '/state/requests'
import { removeRequest as removeFileRequest } from '/state/File'

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
    const [isPending, setIsPending] = useState(false)

    const [ title, setTitle ] = useLocalStorage('group.draft.title', ( group?.title ? group.title : ''))
    const [ about, setAbout ] = useLocalStorage('group.draft.about', ( group?.about ? group.about : ''))
    const [ shortDescription, setShortDescription ] = useLocalStorage('group.draft.shortDescription', (group?.shortDescription ? group.shortDescription: ''))
    const [ rules, setRules ] = useLocalStorage('group.draft.rules', (group?.rules ? group.rules : ''))
    const [ fileId, setFileId] = useLocalStorage('group.draft.fileId', ( group?.fileId ? group.fileId : null))
    const [file] = useFile(fileId)

    const [ titleErrors, setTitleErrors ] = useState(null)
    const [ aboutErrors, setAboutErrors ] = useState(null)
    const [ shortDescriptionErrors, setShortDescriptionErrors ] = useState(null)
    const [ rulesErrors, setRulesErrors ] = useState(null)

    const uploadRequests = useSelector((state) => state.File.requests)
    const [request, makeRequest] = useRequest()

    const fileRef = useRef(null)

    const dispatch = useDispatch()
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

    const resetForm = function() {
        setTitle(null)
        setAbout(null)
        setShortDescription(null)
        setRules(null)
        setFileId(null)

        setIsPending(false)
        setAreYouSure(false)
    }

    const cleanupRequest = function() {
        if ( fileId in uploadRequests ) {
            dispatch(removeRequest({ id: uploadRequests[fileId].requestId }))
            dispatch(removeFileRequest({ fileId: fileId }))
        }
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

    const updateGroup = function() {
        makeRequest(patchGroup(assembleGroup()))
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! validate() ) {
            return
        }

        setIsPending(true)

        cleanupRequest()

        if ( fileId !== null && fileId !== undefined ) {
            fileRef.current?.submit()
        } else {
            updateGroup()
        }
    }

    /**
     * Execute the cancelling of this Group edit and clear the form.
     */
    const cancel = function(event) {
        resetForm()

        cleanupRequest()

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
        if (request?.state === 'fulfilled') {
            resetForm()
   
            navigate(`/group/${request.response.body.entity.slug}`)
        } else if ( request?.state === 'failed' ) {
            setIsPending(false)
        }
    }, [ request ])

    if ( ! group ) {
        return (<Spinner />)
    }

    let baseError = null

    return (
        <div className="group-edit-form">
            <form onSubmit={onSubmit} >
                <div className="group-edit-form__errors">{ baseError }</div>
                <div className="group-edit-form__group-image">
                    <div>
                        { ! fileId && <UserCircleIcon className="placeholder" /> }
                        { fileId && <DraftProfileImage 
                            ref={fileRef}
                            fileId={fileId} 
                            setFileId={setFileId} 
                            width={200} 
                            deleteOnRemove={false} 
                            onProcessingSuccess={() => { setIsPending(false) }}
                            onCropSuccess={() => { updateGroup() }}
                            onError={() => { setIsPending(false)}}
                            onRemove={() => { setIsPending(false)}}
                        /> }
                        { ! fileId  && <FileUploadInput 
                            maxFiles={1}
                            onChange={(fileIds) => { setIsPending(true); setFileId(fileIds[0]) }}
                            kind="image"
                            allowedTypes={[ 'image/jpeg', 'image/png' ]} 
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
                    { isPending && <Spinner /> }
                    { ! isPending && <div className="buttons">
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
