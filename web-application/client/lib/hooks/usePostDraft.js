import { useSelector, useDispatch } from 'react-redux'

import { setDraft as setPostDraft, clearDraft as clearPostDraft } from '/state/posts'

export const usePostDraft = function(id, groupId) {
    let postKey = id !== null && id !== undefined ? id : 'new'
    if ( postKey === 'new' &&  groupId !== null && groupId !== undefined) {
        postKey = `${postKey}_${groupId}`
    }

    const savedDraft = JSON.parse(localStorage.getItem(`post.draft[${postKey}]`))
    const draft = useSelector((state) => postKey in state.posts.drafts ? state.posts.drafts[postKey] : savedDraft)

    const dispatch = useDispatch()

    const setDraft = function(newDraft) {
        if ( newDraft !== null ) {
            dispatch(setPostDraft({ id: postKey, draft: newDraft }))
            localStorage.setItem(`post.draft[${postKey}]`, JSON.stringify(newDraft))
        } else {
            dispatch(clearPostDraft({ id: postKey }))
            localStorage.removeItem(`post.draft[${postKey}]`)
        }
    }

    return [ draft, setDraft ]
}
