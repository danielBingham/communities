import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import ReactCrop from 'react-image-crop'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteFile } from '/state/files'
import { XCircleIcon } from '@heroicons/react/24/solid'


import "react-image-crop/dist/ReactCrop.css"
import "./DraftImageFile.css"

const DraftImageFile = function({ fileId, setFileId, width, shouldCrop, cropAspect, crop, setCrop, deleteOnRemove }) {

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
        let renderWidth = width ? width : 650
        if ( shouldCrop ) {
            let aspect = cropAspect ? cropAspect : 1
            content = (
                <div className="file">
                    <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={aspect}>
                        <a className="remove" href="" onClick={(e) => { e.preventDefault(); remove() }}><XCircleIcon /></a>
                        <img src={`${configuration.backend}/file/${fileId}?width=${renderWidth}`} />
                    </ReactCrop>
                </div>
            )
        } else {
            content = (
                <div className="file">
                    <a className="remove" href="" onClick={(e) => { e.preventDefault(); remove() }}><XCircleIcon /></a>
                    <img src={`${configuration.backend}/file/${fileId}?width=${renderWidth}`} />
                </div>
            )
        }
    }

    return (
        <div className="draft-image-file">
            { content }
        </div>
    )
}

export default DraftImageFile
