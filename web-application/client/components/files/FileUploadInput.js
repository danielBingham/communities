import React, { useState, useEffect, useRef } from 'react'

import { useRequest } from '/lib/hooks/useRequest'

import {  PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

import { uploadFile } from '/state/File'

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

    const [uploadRequest, makeUploadRequest] = useRequest()

    // ============ Actions and Event Handling ======================
    //
    
    const onChange = function(event) {
        const uploadedFileData = event.target.files[0]
        if ( ! props.types.includes(uploadedFileData.type) ) {
            setTypeError('invalid-type')
            return
        }

        makeUploadRequest(uploadFile(uploadedFileData))
    }

    // ============ Effect Handling ==================================

    useEffect(function() {
        if ( uploadRequest && uploadRequest.state == 'fulfilled') {
            const uploadedFile = uploadRequest.response.body.entity

            props.setFileId(uploadedFile.id)

            if ( props.onChange ) {
                props.onChange(uploadedFile.id)
            }
        }
    }, [ uploadRequest ])

    // ============ Render ==========================================
    //
    let content = null
    // Spinner while we wait for requests to process so that we can't start a new request on top of an existing one.
    if ( uploadRequest && uploadRequest.state == 'pending' ) {
        content = ( <Spinner local={true} /> )

    // Request failure - report an error.
    } else if ( uploadRequest && uploadRequest.state == 'failed' ) {
        logger.error(`Upload failed: `, uploadRequest.error)
        content = (<div className="error"> { uploadRequest.error }</div>)
    } else { 
        let typeErrorView = null
        if ( typeError ) {
            typeErrorView = ( <div className="error">Invalid-type selected.  Supported types are: { props.types.join(',') }.</div> )
        }
   
        let icon = ( <PhotoIcon /> )
        if ( props.type === 'video' ) {
            icon = ( <VideoCameraIcon /> )
        }

        content = (
            <div className="upload-input">
                <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}>{ icon } <span className="file-upload-button-text"> { props.text ? props.text : 'Upload Image' }</span></Button>
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
