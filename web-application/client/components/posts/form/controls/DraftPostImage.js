import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getFile, deleteFile, cleanupRequest } from '/state/files'

const DraftPostImage = function({ fileId, setFileId, width }) {

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
        setRequestId(dispatch(deleteFile(fileId)))
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
            <div className="file" style={{ width: `${width}px` }}>
                <img src={url.href} width={ width ? width : 100}  />
                <a href="" onClick={(e) => { e.preventDefault(); remove() }}>Remove file</a>
            </div>
        )
    }

    return (
        <div className="draft-file">
            { content }
        </div>
    )
}

export default DraftPostImage
