import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getFile, deleteFile, cleanupRequest } from '/state/files'
import { XCircleIcon } from '@heroicons/react/24/solid'

import "./DraftImageFile.css"

const DraftImageFile = function({ fileId, setFileId, width, deleteOnRemove }) {

    // ============ Request Tracking ==========================================
   
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.files.requests) {
            return state.files.requests[requestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================
    
    const configuration = useSelector((state) => state.system.configuration)

    // ============ Actions ===================================================
    
    const dispatch = useDispatch()

    const remove = function() {
        setFileId(null)

        if ( deleteOnRemove !== false ) {
            setRequestId(dispatch(deleteFile(fileId)))
        }
    }

    // =========== Effect Handling ============================================
    
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ============ Render ====================================================
    
    let content = null
    if ( fileId) {
        content = (
            <div className="file">
                <a className="remove" href="" onClick={(e) => { e.preventDefault(); remove() }}><XCircleIcon /></a>
                <img src={`${configuration.backend}/file/${fileId}`} />
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
