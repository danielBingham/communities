import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchFeature } from '/state/features'

import Spinner from '/components/Spinner'

const InitializeButton = function(props) {

    const [request, makeRequest] = useRequest()

    const feature = useSelector((state) => props.name && props.name in state.features.dictionary ? state.features.dictionary[props.name] : null)

    const initialize = function(event) {
        event.preventDefault()

        makeRequest(patchFeature({ name: feature.name, status: 'initialized' }))
    }

    const uninitialize = function(event) {
        event.preventDefault()

        makeRequest(patchFeature({ name: feature.name, status: 'uninitialized' }))
    }

    if ( request && request.state == 'pending' ) {
        return ( <Spinner local={true} /> )
    }

    if ( feature.status == 'uninitialized' || feature.status == 'created' ) {
        return ( <button className="initialize" onClick={initialize}>Initialize</button> )
    }

    else if ( feature.status == 'initialized' || feature.status == 'rolled-back') {
        return ( <button className="uninitialize" onClick={uninitialize}>Uninitialize</button> )
    }

    return (
        <button disabled={true} className="initialize">Initialize</button>
    )

}

export default InitializeButton
