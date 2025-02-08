import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

const YourGroups = function() {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const groups = useSelector((state) => 'YourGroups' in state.groups.queries ? state.groups.queries['YourGroups'].list : [])

}

export default YourGroups
