import { useSelector, useDispatch } from 'react-redux'

import * as uuid from 'uuid'

import logger from '/logger'

import { setDraft as setPostDraft, clearDraft as clearPostDraft } from '/state/Post'

import { useGroup } from '/lib/hooks/Group'
import { usePost } from '/lib/hooks/Post'

const has = function(draft, field) {
    return field in draft && draft[field] !== undefined
}

// This will correct any drafts that have an invalid structure, due to code
// changes. This effective migrates local storage.
//
// TODO Should we call this "MigrateDraft" to make that clear?
// TODO FeatureFlagging and migration system that handles localstorage
// migrations!
const validateAndCorrectDraft = function(draft, post, group, sharedPostId) {
    logger.debug(`-- validateAndCorrectDraft::`)
    logger.debug(`-- validateAndCorrectDraft:: draft: `, draft)
    logger.debug(`-- validateAndCorrectDraft:: post: `, post)
    logger.debug(`-- validateAndCorrectDraft:: group: `, group)
    logger.debug(`-- validateAndCorrectDraft:: sharedPostId: `, sharedPostId)

    let defaultType = 'feed'
    let defaultVisibility = 'private'
    if ( group !== undefined && group !== null ) {
        defaultType = 'group'
        if ( group.type === 'open' ) {
            defaultVisibility = 'public'
        }
    }
    
    const correctedDraft = {
        content: post ? post.content : '',
        fileId: post ? post.fileId : null,
        linkPreviewId: post ? post.linkPreveiwId : null,
        sharedPostId: post ? post.sharedPostId : sharedPostId,
        visibility: post ? post.visibility : defaultVisibility,
        type: post ? post.type : defaultType 
    }

    if ( draft === undefined || draft === null ) {
        logger.debug(`Null draft: `, correctedDraft)
        return correctedDraft 
    }

    if ( has(draft, 'content') 
        && draft.content !== null
        && typeof draft.content === 'string' 
        && draft.content.length > 0
    ) {
        correctedDraft.content = draft.content
    }

    if ( has(draft, 'sharedPostId')
        && draft.sharedPostId !== null
        && uuid.validate(draft.sharedPostId)
    ) {
        correctedDraft.sharedPostId = draft.sharedPostId
    }

    if ( has(draft, 'fileId') 
        && draft.fileId !== null 
        && uuid.validate(draft.fileId)
        && correctedDraft.sharedPostId === null
    ) {
        correctedDraft.fileId = draft.fileId
    }

    if( has(draft, 'linkPreviewId')
        && draft.linkPreviewId !== null
        && uuid.validate(draft.linkPreviewId)
        && correctedDraft.sharedPostId === null
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

    logger.debug(`-- validateAndCorrectDraft:: correctedDraft: `, correctedDraft)
    return correctedDraft
}

const getDraftKey = function(id, groupId, sharedPostId) {
    let key = ''

    if ( id !== null && id !== undefined ) {
        key = key + `postId:${id}`
    } else {
        key = key + `postId:new`
    }

    if ( groupId !== null && groupId !== undefined ) {
        key = key + `groupId:${groupId}`
    }

    if ( sharedPostId !== null && sharedPostId !== undefined ) {
        key = key + `sharedPostId:${sharedPostId}`
    }

    return key 
}

export const usePostDraft = function(id, groupId, sharedPostId) {
    logger.debug(`-- usePostDraft(${id}, ${groupId}, ${sharedPostId}) --`)
    const postKey = getDraftKey(id, groupId, sharedPostId)

    const [group] = useGroup(groupId)
    const [post] = usePost(id)

    logger.debug(`-- usePostDraft:: post: `, post)


    // Here we want to correct the draft, because we may need to migrate drafts
    // in local storage due to code updates.
    let savedDraft = JSON.parse(localStorage.getItem(`post.draft[${postKey}]`))
    const draft = validateAndCorrectDraft(
        useSelector((state) => postKey in state.Post.drafts ? state.Post.drafts[postKey] : savedDraft), post, group, sharedPostId
    )

    const dispatch = useDispatch()

    const setDraft = function(newDraft) {
        if ( newDraft !== null ) {
            // TechDebt TODO really we should be validating the draft and
            // throwing an error here.
            const correctedDraft = validateAndCorrectDraft(newDraft, post, group, sharedPostId) 
            dispatch(setPostDraft({ key: postKey, draft: correctedDraft}))
            localStorage.setItem(`post.draft[${postKey}]`, JSON.stringify(correctedDraft))
        } else {
            dispatch(clearPostDraft({ key: postKey }))
            localStorage.removeItem(`post.draft[${postKey}]`)
        }
    }

    return [ draft, setDraft ]
}
