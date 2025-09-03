import { useSelector, useDispatch } from 'react-redux'

import * as uuid from 'uuid'

import { setDraft as setPostDraft, clearDraft as clearPostDraft } from '/state/Post'

import { useGroup } from '/lib/hooks/Group'

const has = function(draft, field) {
    return field in draft && draft[field] !== undefined
}

// This will correct any drafts that have an invalid structure, due to code
// changes. This effective migrates local storage.
//
// TODO Should we call this "MigrateDraft" to make that clear?
// TODO FeatureFlagging and migration system that handles localstorage
// migrations!
const validateAndCorrectDraft = function(draft, group) {
    const correctedDraft = {
        content: '',
        fileId: null,
        linkPreviewId: null,
        visibility: 'private',
        type: group !== undefined && group !== null ? 'group' : 'feed'
    }

    if ( draft === undefined || draft === null ) {
        return correctedDraft 
    }

    if ( has(draft, 'content') 
        && draft.content !== null
        && typeof draft.content === 'string' 
        && draft.content.length > 0
    ) {
        correctedDraft.content = draft.content
    }

    if ( has(draft, 'fileId') 
        && draft.fileId !== null 
        && uuid.validate(draft.fileId)
    ) {
        correctedDraft.fileId = draft.fileId
    }

    if( has(draft, 'linkPreviewId')
        && draft.linkPreviewId !== null
        && uuid.validate(draft.linkPreviewId)
        && correctedDraft.fileId === null
    ) {
        correctedDraft.linkPreviewId = draft.linkPreviewId
    }

    if ( has(draft, 'visibility')
        && draft.visibility !== null
        && ( draft.visibility === 'private' || draft.visibility == 'public' )
    ) {
        // If this is a group post, then the group type determines the
        // visibility.
        if ( group !== undefined && group !== null ) {
            if ( group.type === 'open' ) {
                correctedDraft.visibility = 'public'
            } else {
                correctedDraft.visibility = 'private'
            }
        } else {
            correctedDraft.visibility = draft.visibility
        }
    }

    if ( has(draft, 'type') ) {
        if ( group !== null && group !== undefined && draft.type !== 'group' ) {
            correctedDraft.type = 'group'
        }  else if ( draft.type === 'feed' || draft.type === 'announcement' || draft.type === 'info' )  {
            correctedDraft.type = draft.type
        }
    } 

    return correctedDraft
}

export const usePostDraft = function(id, groupId, sharedPostId) {
    let postKey = id !== null && id !== undefined ? id : 'new'
    if ( postKey === 'new' &&  groupId !== null && groupId !== undefined) {
        postKey = `${postKey}_${groupId}`
    } else if ( postKey === 'new' && sharedPostId !== null && sharedPostId !== undefined ) {
        postKey = `${postKey}-shared:${sharedPostId}`
    }

    const [group] = useGroup(groupId)


    // Here we want to correct the draft, because we may need to migrate drafts
    // in local storage due to code updates.
    let savedDraft = JSON.parse(localStorage.getItem(`post.draft[${postKey}]`))
    const draft = validateAndCorrectDraft(
        useSelector((state) => postKey in state.Post.drafts ? state.Post.drafts[postKey] : savedDraft), group
    )

    const dispatch = useDispatch()

    const setDraft = function(newDraft) {
        if ( newDraft !== null ) {
            // TechDebt TODO really we should be validating the draft and
            // throwing an error here.
            const correctedDraft = validateAndCorrectDraft(newDraft, group) 
            dispatch(setPostDraft({ id: postKey, draft: correctedDraft}))
            localStorage.setItem(`post.draft[${postKey}]`, JSON.stringify(correctedDraft))
        } else {
            dispatch(clearPostDraft({ id: postKey }))
            localStorage.removeItem(`post.draft[${postKey}]`)
        }
    }

    return [ draft, setDraft ]
}
