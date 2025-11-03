import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteFeature } from '/state/features'

import Spinner from '/components/Spinner'

const DeleteButton = function(props) {

    const [request, makeRequest] = useRequest()

    const feature = useSelector((state) => props.name && props.name in state.features.dictionary ? state.features.dictionary[props.name] : null)


    const onClick = function(event) {
        event.preventDefault()

        makeRequest(deleteFeature(feature.name))
    }

    if ( request && request.state == 'pending' ) {
        return ( <Spinner /> )
    }

    if ( feature.status == 'cleaned' ) {
        return ( <button className="delete" onClick={onClick}>Delete</button> )
    }


    return (
        <button disabled={true} className="delete">Delete</button>
    )

}

export default DeleteButton
