import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteFile } from '/state/files'
import { XCircleIcon } from '@heroicons/react/24/solid'

import "./DraftImageFile.css"

const DraftImageFile = function({ fileId, setFileId, width, deleteOnRemove }) {

    // ============ Request Tracking ==========================================
  
    const [request, makeRequest] = useRequest()

    // ============ Redux State ===============================================
    
    const configuration = useSelector((state) => state.system.configuration)

    // ============ Actions ===================================================
    
    const dispatch = useDispatch()

    const remove = function() {
        setFileId(null)

        if ( deleteOnRemove !== false ) {
            makeRequest(deleteFile(fileId))
        }
    }

    // =========== Effect Handling ============================================

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
