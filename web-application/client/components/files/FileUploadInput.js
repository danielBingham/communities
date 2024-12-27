import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { XCircleIcon, PhotoIcon } from '@heroicons/react/24/solid'

import { uploadFile, deleteFile, cleanupRequest } from '/state/files'

import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './FileUploadInput.css'

/**
 * TODO If a page showing this component is reloaded after a file has been
 * chosen, that file is left hanging in the database and on disk.  It's
 * effectively orphaned.  We should fix that.
 */
const FileUploadInput = function(props) {
    // ============ Render State ====================================
    const [ typeError, setTypeError ] = useState(null)

    const hiddenFileInput = useRef(null)

    // ============ Request Tracking ================================
   
    const [uploadRequestId, setUploadRequestId] = useState(null)
    const uploadRequest = useSelector(function(state) {
        if ( uploadRequestId) {
            return state.files.requests[uploadRequestId]
        } else {
            return null
        }
    })

    // ============ Actions and Event Handling ======================
    //
    const dispatch = useDispatch()
    
    const onChange = function(event) {
        const uploadedFileData = event.target.files[0]
        if ( ! props.types.includes(uploadedFileData.type) ) {
            setTypeError('invalid-type')
            return
        }

        setUploadRequestId(dispatch(uploadFile(uploadedFileData)))
    }

    // ============ Effect Handling ==================================

    useEffect(function() {
        if ( uploadRequest && uploadRequest.state == 'fulfilled') {
            const uploadedFile = uploadRequest.result.entity

            props.setFileId(uploadedFile.id)

            if ( props.onChange ) {
                props.onChange(uploadedFile.id)
            }
        }
    }, [ uploadRequest ])

    // Clean up our upload request.
    useEffect(function() {
        return function cleanup() {
            if ( uploadRequestId) {
                dispatch(cleanupRequest({ requestId: uploadRequestId}))
            }
        }
    }, [ uploadRequestId])

    // ============ Render ==========================================
    //
    let content = null
    // Spinner while we wait for requests to process so that we can't start a new request on top of an existing one.
    if ( ( uploadRequestId && ! uploadRequest) || (uploadRequest && uploadRequest.state == 'pending') ) 
    {
        content = ( <Spinner local={true} /> )

    // Request failure - report an error.
    } else if ( uploadRequest && uploadRequest.state == 'failed' ) {
        content = (<div className="error"> { uploadRequest.error }</div>)
    } else { 
        let typeErrorView = null
        if ( typeError ) {
            typeErrorView = ( <div className="error">Invalid-type selected.  Supported types are: { props.types.join(',') }.</div> )
        }
        content = (
            <div className="upload-input">
                <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}><PhotoIcon /><span className="file-upload-button-text"> { props.text ? props.text : 'Upload Image' }</span></Button>
                <input type="file"
                    name="file"
                    accept={props.types.join(',')}
                    onChange={onChange} 
                    style={{ display: 'none' }}
                    ref={hiddenFileInput}
                />
                { typeErrorView }
            </div>
        )
    }

    // Perform the render.
    return (
        <div className="file-upload">
            { content }
            { props.error && <div className="error">{ props.error }</div> }
        </div>
    )
}

export default FileUploadInput 
