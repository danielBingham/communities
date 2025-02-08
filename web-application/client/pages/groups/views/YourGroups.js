import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

const YourGroups = function() {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const groups = useSelector((state) => 'YourGroups' in state.groups.queries ? state.groups.queries['YourGroups'].list : [])

    useEffect(() => {
        if ( currentUser ) {
            makeRequest(getGroups('YourGroups', { userId: currentUser.id }))
        }
    }, [ currentUser ])

    return (
        <div className="your-groups">

        </div>
    )
}

export default YourGroups
