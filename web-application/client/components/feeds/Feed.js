import React, { useEffect, useMemo }  from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupFromSlug } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { GroupPostPermissions, useGroupPostPermission } from '/lib/hooks/permission'

import { getGroups } from '/state/Group'

import PostList from '/components/posts/PostList'
import PostForm, { CreatePostButton } from '/components/posts/PostForm'

import Spinner from '/components/Spinner'

import './Feed.css'

const Feed = function({ type }) {
    const { slug } = useParams()

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [group, groupRequest] = useGroupFromSlug( type === 'group' ? slug : undefined)
    const [currentMember, memberRequest ] = useGroupMember(group?.id, currentUser?.id)

    const canCreateGroupPost = useGroupPostPermission(currentUser, GroupPostPermissions.CREATE, { group: group, userMember: currentMember })

    const params = useMemo(() => {
        const params = {}
        if ( type == 'feed' ) {
            params.feed = slug || 'everything'
        } else if ( type === 'place' ) {
            params.place = 'global'
            params.type = 'feed'
        } else if ( type == 'group') {
            if ( group ) {
                params.groupId = group.id 
            } 
        } else if ( type == 'user' ) {
            params.username = slug 
            params.type = [ 'feed', 'info', 'announcement' ]
        }
        return params
    }, [ type, slug, group ])

    if ( type == 'group' && ! group ) {
        return (
            <div className="feed">
                <Spinner />
            </div>
        )
    }


    return (
        <div className="feed">
            { (  
                type === 'feed' || type === 'place'
                || (type === 'user' && currentUser.username === slug) 
                || (type === 'group' && canCreateGroupPost)) 
                
                    && <CreatePostButton type="form" groupId={ group ? group.id : null } /> 
            }
            <PostList name={`Feed:${type}`} params={ params } /> 
        </div>
    )

}

export default Feed
