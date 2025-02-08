import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchFeature } from '/state/features'

import Spinner from '/components/Spinner'

const MigrateButton = function(props) {

    const [request, makeRequest] = useRequest()

    const feature = useSelector((state) => props.name && props.name in state.features.dictionary ? state.features.dictionary[props.name] : null) 

    const migrate = function(event) {
        event.preventDefault()

        makeRequest(patchFeature({ name: feature.name, status: 'migrated' }))
    }

    const rollback = function(event) {
        event.preventDefault()

        makeRequest(patchFeature({ name: feature.name, status: 'rolled-back' }))
    }

    if ( request && request.state == 'in-progress' ) {
        return ( <Spinner local={true} /> )
    }

    if ( feature.status == 'initialized' || feature.status == 'rolled-back') {
        return ( <button className="migrate" onClick={migrate}>Migrate</button> )
    }

    else if ( feature.status == 'migrated' || feature.status == 'disabled' ) {
        return ( <button className="rollback" onClick={rollback}>Rollback</button> )
    }

    return (
        <button disabled={true} className="migrate">Migrate</button>
    )

}

export default MigrateButton
