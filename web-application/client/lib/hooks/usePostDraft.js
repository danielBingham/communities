import { useSelector, useDispatch } from 'react-redux'

import { setDraft as setPostDraft, clearDraft as clearPostDraft } from '/state/posts'

export const usePostDraft = function(id) {
    let postId = id ? id : 'new'

    const savedDraft = JSON.parse(localStorage.getItem(`post.draft[${postId}]`))
    const draft = useSelector((state) => postId in state.posts.drafts ? state.posts.drafts[postId] : savedDraft)

    const dispatch = useDispatch()

    const setDraft = function(newDraft) {
        if ( newDraft !== null ) {
            dispatch(setPostDraft({ id: postId, draft: newDraft }))
            localStorage.setItem(`post.draft[${postId}]`, JSON.stringify(newDraft))
        } else {
            dispatch(clearPostDraft({ id: postId }))
            localStorage.removeItem(`post.draft[${postId}]`)
        }
    }

    return [ draft, setDraft ]
}
