import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

import GroupView from '/components/groups/view/GroupView'

import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import './GroupPage.css'

const GroupPage = function() {

    const { slug } = useParams()

    const [request, makeRequest] = useRequest()

    const id = useSelector((state) => 'GroupPage' in state.groups.queries ? state.groups.queries['GroupPage'].list[0] : null)
    const group = useSelector((state) => id !== null && id in state.groups.dictionary ? state.groups.dictionary[id] : null)

    useEffect(() => {
            makeRequest(getGroups('GroupPage', { slug: slug }))
    }, [ slug ])

    if ( ! group && ( ! request || request.state == 'pending') )  {
        return (
            <div id="group-page">
                <Spinner />
            </div>
        )
    } else if ( ! group ) {
        // The request won't failed, because it's a search request.  So it will
        // just return an empty result.
        return (
            <div id="user-profile-page">
                <Error404 />
            </div>
        )
    }

    return (
        <div id="group-page">
            <div className='right-sidebar'>
                <GroupView id={id} />
            </div>
            <div className='main'>
                { /*<GroupPostFeed id={id} /> */}
            </div>
        </div>
    )

}

export default GroupPage
