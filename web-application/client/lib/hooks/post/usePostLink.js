import { usePost } from './usePost'
import { useGroup } from '/lib/hooks/group'
import { useUser } from '/lib/hooks/User'


export const usePostLink = function(id) {
    const [post] = usePost(id)
    const [group] = useGroup(post?.groupId)
    const [user] = useUser(post?.userId)

    if ( post === null 
        || ( post.groupId !== null && group === null) 
        || (post.userId !== null && user === null)
    ) {
        return ''
    }
    
    let postLink = `/${user.username}/${id}`
    if ( post.groupId && group ) {
        postLink = `/group/${group.slug}/${id}`
    }

    return postLink
}
