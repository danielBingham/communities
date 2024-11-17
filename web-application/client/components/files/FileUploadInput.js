import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/solid'

import { uploadFile, deleteFile, cleanupRequest } from '/state/files'

import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './FileUploadInput.css'

/**
 *
 * TODO If a page showing this component is reloaded after a file has been
 * chosen, that file is left hanging in the database and on disk.  It's
 * effectively orphaned.  We should fix that.
 */
const FileUploadInput = function(props) {
    // ============ Render State ====================================
  
    const [file, setFile] = useState(null)
    const [fileData, setFileData] = useState(null)

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

    const [deleteRequestId, setDeleteRequestId] = useState(null)
    const deleteRequest = useSelector(function(state) {
        if ( deleteRequestId ) {
            return state.files.requests[deleteRequestId]
        } else {
            return null
        }
    })

    // ============ Actions and Event Handling ======================
    //
    const dispatch = useDispatch()
    
    const onChange = function(event) {
        if ( ! fileData && ! file ) {
            const file = event.target.files[0]
            if ( ! props.types.includes(file.type) ) {
                setTypeError('invalid-type')
                return
            }

            setFileData(file)
            setUploadRequestId(dispatch(uploadFile(file)))
        } else {
            // We shouldn't be able to get here, because we should always show
            // a spinner when we have fileData but no file, and we don't show
            // an input when we have both fileData and file.  Which means the
            // user shouldn't be able to change the file input.
            throw new Error('We are in an invalid state.')
        }
    }

    const removeFile = function(event) {
        setTypeError(null)
        setDeleteRequestId(dispatch(deleteFile(file.id)))
    }

    // ============ Effect Handling ==================================

    useLayoutEffect(function() {
        if ( props.file ) {
            setFile(props.file)
        }
    }, [])

    useLayoutEffect(function() {
        if ( deleteRequest && deleteRequest.state == 'fulfilled') {
            setFileData(null)
            setFile(null)
            props.setFile(null)

            // ISSUE #133 - With out the line below, this effect will fire a
            // second time and read the request as fulfilled a second time
            // after an "onChange" has been trigged due to a new upload.  That
            // will cause the upload to be wiped out.  I'm not entirely sure
            // what's causing the effect to fire again after the request has
            // been updated to "fulfilled" because we haven't seen that in
            // other components.
            //
            // In any case, the line below fixes it.
            setDeleteRequestId(null)

            if ( uploadRequestId && uploadRequest )  {
                setUploadRequestId(null)
            } 
        }
    }, [ deleteRequest ])


    useEffect(function() {
        if ( uploadRequest && uploadRequest.state == 'fulfilled') {
            const response = uploadRequest.result
            setFile(response.entity)
            props.setFile(response.entity)
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

    // Clean up our delete request.
    useEffect(function() {
        return function cleanup() {
            if ( deleteRequestId ) {
                dispatch(cleanupRequest({ requestId: deleteRequestId}))
            }
        }
    }, [ deleteRequestId ])



    // ============ Render ==========================================

    let content = null
    // Spinner while we wait for requests to process so that we can't start a new request on top of an existing one.
    if ( (deleteRequestId && ! deleteRequest) || (deleteRequest && deleteRequest.state == 'pending') 
        || ( uploadRequestId && ! uploadRequest) || (uploadRequest && uploadRequest.state == 'pending') ) 
    {
        content = ( <Spinner local={true} /> )

    // Request failure - report an error.
    } else if (  deleteRequest && deleteRequest.state == 'failed') {
        content = (
            <div className="error">
                <p>The attempt to delete your file failed with the following error: { deleteRequest.error }</p>
                <p>Please report this as a bug and refresh the page to try again.</p>
            </div>
            )
    } else if ( uploadRequest && uploadRequest.state == 'failed' ) {
        content = (<div className="error"> { uploadRequest.error }</div>)
    } else { 
        // We're not waiting for any thing, render the content.
        if ( fileData && file ) {
            console.log(file)
            const url = new URL(file.filepath, file.location)
            content = (
                <div className="file">
                    <div className="close-icon"><XCircleIcon onClick={removeFile} /></div>
                    <img src={url.href} width={100} />
                </div>
            )
        } else if (( fileData && ! file) ) {
            content = ( <Spinner local={true} /> )
        } else {
            let typeErrorView = null
            if ( typeError ) {
                typeErrorView = ( <div className="error">Invalid-type selected.  Supported types are: { props.types.join(',') }.</div> )
            }
            content = (
                <div className="upload-input">
                    <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}>Add Image</Button>
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
