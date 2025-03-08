import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchFeature } from '/state/features'

import Spinner from '/components/Spinner'

const EnableButton = function(props) {

    const [request, makeRequest] = useRequest()

    const feature = useSelector((state) => props.name && props.name in state.features.dictionary ? state.features.dictionary[props.name] : null)

    const dispatch = useDispatch()

    const enable = function(event) {
        event.preventDefault()

        makeRequest(patchFeature({ name: feature.name, status: 'enabled' }))
    }

    const disable = function(event) {
        event.preventDefault()

        makeRequest(patchFeature({ name: feature.name, status: 'disabled' }))
    }

    if ( request && request.state == 'pending' ) {
        return ( <Spinner local={true} /> )
    }

    if ( feature.status == 'migrated' || feature.status == 'disabled') {
        return ( <button className="enable" onClick={enable}>Enable</button> )
    }

    else if ( feature.status == 'enabled' ) {
        return ( <button className="disable" onClick={disable}>Disable</button> )
    }

    return (
        <button disabled={true} className="enable">Enable</button>
    )

}

export default EnableButton
