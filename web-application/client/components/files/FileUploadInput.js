import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { XCircleIcon, PhotoIcon } from '@heroicons/react/24/solid'

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
    const [currentFileId, setCurrentFileId] = useState(null)
    const [newFileId, setNewFileId] = useState(null)

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

    const currentFile = useSelector(function(state) {
        if ( currentFileId in state.files.dictionary ) {
            return state.files.dictionary[currentFileId]
        } else {
            return null
        }
    })

    const newFile = useSelector(function(state) {
        if ( newFileId in state.files.dictionary ) {
            return state.files.dictionary[newFileId]
        } else {
            return null
        }
    })

    console.log(`fileId: ${props.fileId}, currentFileId: ${currentFileId}.`)
    console.log(currentFile)

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

    const removeFile = function(event) {
        if ( currentFileId ) {
            props.setFileId(null)
            setCurrentFileId(null)

            if ( props.onChange ) {
                props.onChange(null)
            }
        } else if ( newFileId ) {
            setTypeError(null)
            setDeleteRequestId(dispatch(deleteFile(newFileId)))
        }
    }

    // ============ Effect Handling ==================================

    useEffect(function() {
        if ( props.fileId ) {
            setCurrentFileId(props.fileId)

            // New File is no longer new.
            if ( newFileId == props.fileId) {
                setNewFileId(null)
            }
        }
    }, [ props.fileId ])

    useEffect(function() {
        if ( uploadRequest && uploadRequest.state == 'fulfilled') {
            const uploadedFile = uploadRequest.result.entity

            setNewFileId(uploadedFile.id)
            props.setFileId(uploadedFile.id)

            if ( props.onChange ) {
                props.onChange(uploadedFile.id)
            }
        }
    }, [ uploadRequest ])

    useEffect(function() {
        if ( deleteRequest && deleteRequest.state == 'fulfilled') {
            const deletedFile = deleteRequest.result.entity

            if ( currentFileId == deletedFile.id ) {
                setCurrentFileId(null)
                props.setFileId(null)

                if ( props.onChange ) {
                    props.onChange(null)
                }
            } else if ( newFileId == deletedFile.id ) {
                setNewFileId(null)
            }

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
    //
    let currentFileView = null 
    if ( newFile || currentFile ) {
        let url = null
        if ( newFile ) {
            url = new URL(newFile.filepath, newFile.location)
        } else if ( currentFile ) {
            url = new URL(currentFile.filepath, currentFile.location)
        }
        currentFileView = (
            <div className="file" style={{ width: `${props.width}px` }}>
                <img src={url.href} width={ props.width ? props.width : 100}  />
                <a href="" onClick={(e) => { e.preventDefault(); removeFile() }}>Remove file</a>
            </div>
        )
    }

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
        if ( currentFileView ) {
            content = currentFileView
        } else {
            let typeErrorView = null
            if ( typeError ) {
                typeErrorView = ( <div className="error">Invalid-type selected.  Supported types are: { props.types.join(',') }.</div> )
            }
            content = (
                <div className="upload-input">
                    { props.blankImage ? props.blankImage : '' }
                    <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}><PhotoIcon /> Upload Image</Button>
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
