import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { postFeatures } from '/state/features'

import Spinner from '/components/Spinner'

const InsertButton = function(props) {

    const [request, makeRequest] = useRequest()

    const feature = useSelector((state) => props.name && props.name in state.features.dictionary ? state.features.dictionary[props.name] : null)

    const initialize = function(event) {
        event.preventDefault()

        makeRequest(postFeatures({ name: feature.name }))
    }

    if ( request && request.state == 'pending' ) {
        return ( <Spinner local={true} /> )
    }

    if ( feature.status == 'uncreated' ) {
        return ( <button className="insert" onClick={initialize}>Insert</button> )
    }

    return (
        <button disabled={true} className="insert">Insert</button>
    )

}

export default InsertButton
