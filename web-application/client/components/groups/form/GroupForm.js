import React, { useRef, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { GlobeAltIcon, LockOpenIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'

import * as shared from '@communities/shared'

import can, { Actions, Entities } from '/lib/permission'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'
import { useGroupPermissionContext } from '/lib/hooks/Group'

import { postGroups } from '/state/Group'

import DraftProfileImage from '/components/files/DraftProfileImage'
import FileUploadInput from '/components/files/FileUploadInput'

import Button from '/components/generic/button/Button'
import Input from '/components/ui/Input'
import TextBox from '/components/generic/text-box/TextBox'
import Spinner from '/components/Spinner'
import { Radio, RadioOption } from '/components/ui/Radio'
import { RequestErrorModal } from '/components/errors/RequestError'
import ErrorCard from '/components/errors/ErrorCard'

import './GroupForm.css'

const GroupForm = function({ parentId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [context, requests] = useGroupPermissionContext(currentUser, parentId)
    const parentGroup = context.group
    const canCreateGroup = can(currentUser, Actions.create, Entities.Group, context)

    const [ title, setTitle ] = useLocalStorage('group.draft.title', '')
    const [ slug, setSlug ] = useLocalStorage('group.draft.slug', '')
    const [ type, setType ] = useLocalStorage('group.draft.type', ( parentGroup?.type === 'hidden' ? 'hidden-private' : 'private'))
    const [ postPermissions, setPostPermissions ] = useLocalStorage('group.draft.postPermissions', 'members')
    const [ about, setAbout ] = useLocalStorage('group.draft.about', '')
    const [ shortDescription, setShortDescription ] = useLocalStorage('group.draft.shortDescription', '')
    const [ rules, setRules ] = useLocalStorage('group.draft.rules', '')
    const [ fileId, setFileId] = useLocalStorage('group.draft.fileId', null)
    const [ fileState, setFileState] = useState(null)

    const [ titleErrors, setTitleErrors ] = useState(null) 
    const [ slugErrors, setSlugErrors ] = useState(null)
    const [ typeErrors, setTypeErrors ] = useState(null)
    const [ postPermissionsErrors, setPostPermissionsErrors ] = useState(null)
    const [ aboutErrors, setAboutErrors ] = useState(null)
    const [ shortDescriptionErrors, setShortDescriptionErrors ] = useState(null)
    const [ rulesErrors, setRulesErrors ] = useState(null)

    const hasSubgroups = useFeature('issue-165-subgroups')
    const hasRules = useFeature('issue-330-group-short-description-and-rules')

    const [request, makeRequest] = useRequest()
    const fileRef = useRef(null)

    const validate = function(field) {
        
        const schema = new shared.schema.GroupSchema()
        let titleValidationErrors = []
        if ( ! field || field == 'title' ) {
            titleValidationErrors = schema.properties.title.validate(title)
            if ( titleValidationErrors.length > 0 ) {
                setTitleErrors(titleValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setTitleErrors(null)
            }
        } 

        let slugValidationErrors = []
        if ( ! field || field == 'slug' ) {
            slugValidationErrors = schema.properties.slug.validate(slug)
            if ( slugValidationErrors.length > 0 ) {
                setSlugErrors(slugValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setSlugErrors(null)
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
            shortDescriptionValidationErrors = schema.properties.shortDescription.validate(shortDescription)
            if ( shortDescriptionValidationErrors.length > 0 ) {
                setShortDescriptionErrors(shortDescriptionValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setShortDescriptionErrors(null)
            }
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


        let typeValidationErrors = []
        if ( ! field || field == 'type' ) {
            typeValidationErrors = schema.properties.type.validate(type)
            if ( typeValidationErrors.length > 0 ) {
                setTypeErrors(typeValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setTypeErrors(null)
            }
        }

        let postPermissionsValidationErrors = []
        if ( ! field || field === 'postPermissions' ) {
            postPermissionsValidationErrors = schema.properties.postPermissions.validate(postPermissions)
            if ( postPermissionsValidationErrors.length > 0 ) {
                setPostPermissionsErrors(typeValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setPostPermissionsErrors(null)
            }
        }

        return titleValidationErrors.length === 0 
            && slugValidationErrors.length === 0 
            && aboutValidationErrors.length === 0 
            && shortDescriptionValidationErrors.length === 0
            && rulesValidationErrors.length === 0
            && typeValidationErrors.length === 0
            && postPermissionsValidationErrors.length === 0
    }

    const assembleGroup = function() {
        const group = {
            type: type,
            postPermissions: postPermissions,
            title: title,
            slug: slug,
            about: about,
            fileId: fileId
        }

        if ( hasSubgroups === true) {
            group.parentId = parentId
        }

        if ( hasRules === true ) {
            group.shortDescription = shortDescription
            group.rules = rules
        }

        return group

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
        currentSlug = currentSlug.replaceAll(/[^a-zA-Z0-9\-_]/g, '')

        // When this is called, `event.target.value` will be the next value of
        // `title` and `title` will be the current value for it.  We only want
        // to update the `slug` if the user kept the `slug` as the
        // autogenerated one.  In other words, if we generate a slug from
        // `title` and it matches our current slug then we want to update our
        // current slug for the new value of title.  Otherwise, we don't want
        // to change it, because the user already customized it.
        if ( slug == currentSlug) {
            let newSlug = event.target.value.toLowerCase().replaceAll(/\s/g, '-')
            newSlug = newSlug.replaceAll(/[^a-zA-Z0-9\-_]/g, '')
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

    if ( parentId !== undefined && (parentGroup === undefined || requests.hasPending() )) {
        return (
            <Spinner />
        )
    }

    if ( canCreateGroup !== true ) {
        return (
            <ErrorCard href={`/group/${parentGroup.slug}`}>
                <section>
                    <h1>Not Authorized</h1>
                    <p>You don't have permission to create a subgroup in that group.</p>
                </section>
            </ErrorCard>
        )
    }

    const inProgress = (request && request.state == 'pending') || (fileId && fileState === 'pending') 
    return (
        <form onSubmit={onSubmit} className="group-form">
            { hasSubgroups && parentGroup && <div className="group-form__parent">
                <span>Subgroup of { parentGroup.title}</span>
            </div> }
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
            { hasRules && 
                <TextBox
                    name="shortDescription"
                    className="short-description"
                    label="Short Description"
                    explanation={`Enter a short description for the group no longer than 250 characters.  This description will be used in the Group Badge on the search page and on the Group Profile Page.`}
                    value={shortDescription}
                    onChange={(event) => setShortDescription(event.target.value)}
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
                    onChange={(event) => setRules(event.target.value)}
                    error={rulesErrors}
                />
            }
            <Radio 
                className="group-form__type" 
                name="type"
                title="Visibility" 
                explanation={ ! parentGroup ? "Who is this group visible to?" : "Who is this group visible to? The visibility of Subgroups is determined by the most restricted visibility of its parents.  A subgroup with a hidden ancestor will be hidden from anyone except members of its ancestors below the hidden group."} 
                error={typeErrors} 
            >
                { ( ! parentGroup || parentGroup.type === 'open') && <>
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
                </> }
                { ( parentGroup?.type === 'private' || parentGroup?.type === 'private-open') && <>
                    <RadioOption
                        name="type"
                        label="Open to Group Members"
                        value="private-open"
                        current={type}
                        explanation="Open for members of parent groups, private for everyone else.  Members from parent groups may add themselves and view all posts.  People who aren't members of a parent group can see that the group exists, its title and description."
                        onClick={(e) => setType('private-open')}
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
                </> }
                {  ( parentGroup?.type === 'hidden' || parentGroup?.type === 'hidden-open' || parentGroup?.type === 'hidden-private' ) && <>
                    <RadioOption
                        name="type"
                        label="Open to Group Members"
                        value="hidden-open"
                        current={type}
                        explanation="Open for members of parent groups, hidden for everyone else. Members from parent groups may add themselves and view all posts.  People who aren't members of a parent group cannot see that the group exists."
                        onClick={(e) => setType('hidden-open')}
                    /> 
                    <RadioOption
                        name="type"
                        label="Private to Group Members"
                        value="hidden-private"
                        current={type}
                        explanation="Private for members of parent groups, hidden for everyone else. Members of parent groups can see that the group exists, its title and description.  Parent group members may request to be added or may be invited by admins and moderators. Posts are only visible to approved group members. Non-members cannot see that it exists."
                        onClick={(e) => setType('hidden-private')}
                        />
                    <RadioOption
                        name="type"
                        label="Hidden"
                        value="hidden"
                        current={type}
                        explanation="Only members and invitees can even see that it exists.  All posts are private and visible to members only.  New members must be invited by admins and moderators."
                        onClick={(e) => setType('hidden')}
                    />
                </> }
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
