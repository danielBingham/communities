import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { GlobeAltIcon, LockOpenIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'

import * as shared from '@communities/shared'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'

import { postGroups } from '/state/Group'

import DraftProfileImage from '/components/files/DraftProfileImage'
import FileUploadInput from '/components/files/FileUploadInput'

import Button from '/components/generic/button/Button'
import Input from '/components/generic/input/Input'
import TextBox from '/components/generic/text-box/TextBox'
import Spinner from '/components/Spinner'
import { Radio, RadioOption } from '/components/ui/Radio'
import { RequestErrorModal } from '/components/errors/RequestError'

import './GroupForm.css'

const GroupForm = function() {
    const [ title, setTitle ] = useLocalStorage('group.draft.title', '')
    const [ slug, setSlug ] = useLocalStorage('group.draft.slug', '')
    const [ type, setType ] = useLocalStorage('group.draft.type', 'private')
    const [ postPermissions, setPostPermissions ] = useLocalStorage('group.draft.postPermissions', 'members')
    const [ about, setAbout ] = useLocalStorage('group.draft.about', '')
    const [ fileId, setFileId] = useLocalStorage('group.draft.fileId', null)
    const [ fileState, setFileState] = useState(null)

    const [ titleErrors, setTitleErrors ] = useState(null) 
    const [ slugErrors, setSlugErrors ] = useState(null)
    const [ typeErrors, setTypeErrors ] = useState(null)
    const [ postPermissionsErrors, setPostPermissionsErrors ] = useState(null)
    const [ aboutErrors, setAboutErrors ] = useState(null)


    const [request, makeRequest] = useRequest()
    const fileRef = useRef(null)

    const validate = function(field) {

        let titleValidationErrors = []
        if ( ! field || field == 'title' ) {
            titleValidationErrors = shared.validation.Group.validateTitle(title)
            if ( titleValidationErrors.length > 0 ) {
                setTitleErrors(titleValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setTitleErrors(null)
            }
        } 

        let slugValidationErrors = []
        if ( ! field || field == 'slug' ) {
            slugValidationErrors = shared.validation.Group.validateSlug(slug)
            if ( slugValidationErrors.length > 0 ) {
                setSlugErrors(slugValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setSlugErrors(null)
            }
        }

        let aboutValidationErrors = []
        if ( ! field || field == 'about' ) {
            aboutValidationErrors = shared.validation.Group.validateAbout(about)
            if ( aboutValidationErrors.length > 0 ) {
                setAboutErrors(aboutValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setAboutErrors(null)
            }
        }

        let typeValidationErrors = []
        if ( ! field || field == 'type' ) {
            typeValidationErrors = shared.validation.Group.validateType(type)
            if ( typeValidationErrors.length > 0 ) {
                setTypeErrors(typeValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setTypeErrors(null)
            }
        }

        let postPermissionsValidationErrors = []
        if ( ! field || field === 'postPermissions' ) {
            postPermissionsValidationErrors = shared.validation.Group.validatePostPermissions(postPermissions)
            if ( postPermissionsValidationErrors.length > 0 ) {
                setPostPermissionsErrors(typeValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setPostPermissionsErrors(null)
            }
        }


        return titleValidationErrors.length === 0 
            && slugValidationErrors.length === 0 
            && aboutValidationErrors.length === 0 
            && typeValidationErrors.length === 0
            && postPermissionsValidationErrors.length === 0
    }

    const assembleGroup = function() {
        return {
            type: type,
            postPermissions: postPermissions,
            title: title,
            slug: slug,
            about: about,
            fileId: fileId
        }
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! validate() ) {
            return
        }

        // If we have a file, we need to crop it first, and we don't want to
        // send the primary Group request until the crop is successful (in case
        // it errors).
        if ( fileId !== null && fileId !== undefined ) {
            fileRef.current?.submit()
        }
        makeRequest(postGroups(assembleGroup()))
    }

    const cancel = function(event) {
        setTitle(null)
        setType(null)
        setPostPermissions(null)
        setSlug(null)
        setAbout(null)
        setFileId(null)

        navigate('/groups')
    }

    const onTitleChange = function(event) {
        let currentSlug = title.toLowerCase().replaceAll(/\s/g, '-')
        currentSlug = currentSlug.replaceAll(/[^a-zA-Z0-9\.\-_]/g, '')

        // When this is called, `event.target.value` will be the next value of
        // `title` and `title` will be the current value for it.  We only want
        // to update the `slug` if the user kept the `slug` as the
        // autogenerated one.  In other words, if we generate a slug from
        // `title` and it matches our current slug then we want to update our
        // current slug for the new value of title.  Otherwise, we don't want
        // to change it, because the user already customized it.
        if ( slug == currentSlug) {
            let newSlug = event.target.value.toLowerCase().replaceAll(/\s/g, '-')
            newSlug = newSlug.replaceAll(/[^a-zA-Z0-9\.\-_]/g, '')
            setSlug(newSlug)
        }

        setTitle(event.target.value)
    }

    const navigate = useNavigate()
    useEffect(() => {
        if ( request?.state === 'fulfilled') {
            setTitle(null)
            setType(null)
            setPostPermissions(null)
            setSlug(null)
            setAbout(null)
            setFileId(null)
   
            navigate(`/group/${encodeURIComponent(request.response.body.entity.slug)}`)
        } 
    }, [ request, fileId])

    let baseError = null 

    const inProgress = (request && request.state == 'pending') || (fileId && fileState === 'pending') 
    return (
        <form onSubmit={onSubmit} className="group-form">
            <div className="group-form__group-image">
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
            <Input
                name="title"
                label="Title"
                explanation="Give this group a title."
                value={title}
                className="title"
                onBlur={ (event) => validate('title') }
                onChange={onTitleChange} 
                error={titleErrors}
            />

            <Input
                name="slug"
                label="URL"
                explanation="Give this group a URL.  This will be used to access the group page and should match the group title. Must be composed of letters, numbers, '.', '_', and '-'."
                value={slug}
                className="slug"
                onBlur={ (event) => validate('slug') }
                onChange={ (event) => setSlug(event.target.value) } 
                error={slugErrors}
            />
            <TextBox
                name="about"
                className="about"
                label="About"
                explanation={`Enter a description of this group.  This should include a description of the group's purpose, it's rules, and what sort of content is appropriate for this group.`}
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                error={aboutErrors}
            />
            <Radio 
                className="group-form__type" 
                name="type"
                title="Visibility" 
                explanation="Who is this group visible to?"
                error={typeErrors} 
            >
                <RadioOption
                    name="type"
                    label="Public"
                    value="open"
                    current={type}
                    explanation="Anyone may add themselves and all posts in the group are public."
                    onClick={(e) => setType('open')}
                />
                <RadioOption
                    name="type"
                    label="Private"
                    value="private"
                    current={type}
                    explanation="Anyone can see that the group exists, its title and description.  People may request to be added or may be invited by admins and moderators. Posts are only visible to approved group members."
                    onClick={(e) => setType('private')}
                    />
                <RadioOption
                    name="type"
                    label="Hidden"
                    value="hidden"
                    current={type}
                    explanation="Only members and invitees can even see that it exists.  All posts are private and visible to members only.  New members must be invited by admins and moderators."
                    onClick={(e) => setType('hidden')}
                />
            </Radio>
            <Radio 
                className="group-form__post-permissions" 
                name="postPermissions"
                title="Posting Permissions" 
                explanation="Who can post in this group?"
                error={postPermissionsErrors} 
            >
                <RadioOption
                    name="postPermissions"
                    label="Anyone"
                    value="anyone"
                    current={postPermissions}
                    explanation="Anyone who can see the group and its content may post in it, whether they are members or not."
                    onClick={(e) => setPostPermissions('anyone')}
                />
                <RadioOption
                    name="postPermissions"
                    label="Members"
                    value="members"
                    current={postPermissions}
                    explanation="Only group members may post in the group."
                    onClick={(e) => setPostPermissions('members')}
                    />
                <RadioOption
                    name="postPermissions"
                    label="Require Approval"
                    value="approval"
                    current={postPermissions}
                    explanation="Group moderators must approval all posts before they are posted to the group."
                    onClick={(e) => setPostPermissions('approval')}
                />
                <RadioOption
                    name="postPermissions"
                    label="Restricted"
                    value="restricted"
                    current={postPermissions}
                    explanation="Only group moderators and admins may post in the group."
                    onClick={(e) => setPostPermissions('restricted')}
                />
            </Radio>
            <div className="group-form__errors">{ baseError }</div>
            { inProgress && <Spinner /> }
            { ! inProgress && <div className="group-form__controls">
                <Button onClick={(e) => cancel()}>Cancel</Button> 
                <input type="submit" name="submit" value="Submit" />
            </div> }
            <RequestErrorModal request={request} message={"Create Group"} />
        </form>
    )

}

export default GroupForm
