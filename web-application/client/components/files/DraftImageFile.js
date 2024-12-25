import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getFile, deleteFile, cleanupRequest } from '/state/files'
import { XCircleIcon } from '@heroicons/react/24/solid'

import "./DraftImageFile.css"

const DraftImageFile = function({ fileId, setFileId, width, deleteOnRemove }) {

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.files.requests) {
            return state.files.requests[requestId]
        } else {
            return null
        }
    })

    const file = useSelector(function(state) {
        if ( fileId in state.files.dictionary ) {
            return state.files.dictionary[fileId]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()

    const remove = function() {
        setFileId(null)

        if ( deleteOnRemove !== false ) {
            setRequestId(dispatch(deleteFile(fileId)))
        }
    }

    useEffect(function() {
        if ( ! file ) {
            setRequestId(dispatch(getFile(fileId)))
        }
    }, [ fileId, file ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let content = null
    if ( file ) {
        let url = new URL(file.filepath, file.location)
        content = (
            <div className="file">
                <a className="remove" href="" onClick={(e) => { e.preventDefault(); remove() }}><XCircleIcon /></a>
                <img src={url.href} />
            </div>
        )
    }

    return (
        <div className="draft-image-file">
            { content }
        </div>
    )
}

export default DraftImageFile
