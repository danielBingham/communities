/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import * as Uuid from 'uuid'

import {  PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { uploadImage, uploadVideo, postFiles } from '/state/File'

import { createError } from '/lib/errors'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { RequestErrorModal } from '/components/errors/RequestError'

import Spinner from '/components/Spinner'
import Button from '/components/ui/Button'
import Alert from '/components/ui/Alert'

import './FileUploadInput.css'

export const ErrorTypes = {
    InvalidFileType: 'invalid-file-type',
    EmptyFile: 'empty-file',
    MaxFilesOverrun: 'max-files-overrun'
}


/**
 * TODO If a page showing this component is reloaded after a file has been
 * chosen, that file is left hanging in the database and on disk.  It's
 * effectively orphaned.  We should fix that.
 */
const FileUploadInput = function({ text, maxFiles, kind, allowedTypes, onChange, onError }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [ fileError, setFileError ] = useState([])
    const [fileMap, setFileMap] = useState({})
    
    const hasVideoUploads = useFeature('issue-67-video-uploads')

    const hiddenFileInput = useRef(null)

    const [postRequest, makePostRequest] = useRequest()
    const [uploadRequest, makeUploadRequest] = useRequest('FileUploadInput')
    
    const onChangeInternal = function(event) {
        if ( event.target.files.length <= 0 ) {
            return
        }

        if ( event.target.files.length > maxFiles ) {
            if ( onError ) {
                onError(createError(ErrorTypes.MaxFilesOverrun, `Too many files. You may not select more than ${maxFiles} more files.`))
            }
        }
        
        const errors = []
        let files = []
        let newFileMap = {}
        for(let index = 0; index < event.target.files.length; index++) {
            const uploadedFileData = event.target.files[index] 
            if ( ! allowedTypes.includes(uploadedFileData.type) ) {
                errors.push(createError(ErrorTypes.InvalidFileType, `'${uploadedFileData.name}' was an invalid file type.  Supported types are: ${ allowedTypes.join(',') }`))
                continue 
            }

            if ( uploadedFileData.size <= 0 ) {
                errors.push(createError(ErrorTypes.EmptyFile, `'${uploadedFileData.name}' was empty.`))
                continue 
            }

            if ( files.length >= maxFiles ) {
                break
            }

            const newFile = {
                id: Uuid.v4(),
                userId: currentUser.id,
                type: uploadedFileData.type
            }

            if ( hasVideoUploads === true ) {
                newFile.kind = kind 
                newFile.state = 'pending'
                newFile.mimetype = uploadedFileData.type
            }

            newFileMap[index] = newFile.id

            files.push(newFile)
        }

        setFileError(errors)

        // If we didn't successfully upload any files, just bail.
        if ( files.length === 0 ) {
            return
        }

        setFileMap({ ...fileMap, ...newFileMap })
        makePostRequest(postFiles(files))
    }

    const onErrorInternal = function() {
        if ( hiddenFileInput.current !== null && hiddenFileInput.current !== undefined) {
            hiddenFileInput.current.value = null
        }
    }

    useEffect(function() {
        if ( postRequest?.state === 'fulfilled' ) {
            for(let index = 0; index < hiddenFileInput.current.files.length; index++) {
                let fileData = hiddenFileInput.current.files[index] 
                if ( index >= maxFiles ) {
                    break
                }

                if ( ! ( index in fileMap ) ) {
                    logger.error(`File, '${fileData.name}', missing from fileMap.`)
                    continue
                }

                const id = fileMap[index]
                if ( kind === 'image' ) {
                    makeUploadRequest(uploadImage(id, fileData))
                } else if ( kind === 'video' ) {
                    makeUploadRequest(uploadVideo(id, fileData))
                } 
            }

            const createdFileIds = Object.keys(postRequest.response.body.dictionary)

            if ( onChange ) {
                onChange(createdFileIds)
            }
        }
    }, [ postRequest ])

    // ============ Render ==========================================

    if ( kind !== 'image' && kind !== 'video' ) {
        logger.error(`Invalid FileUpload type, '${kind}'.`)
        return null
    }

    const State = {
        isPreparingUpload: 'isPreparingUpload',
        isPendingUpload: 'isPendingUpload',
        isUploading: 'isUploading',
        isProcessing: 'isProcessing',
        isAwaitingFile: 'isAwaitingFile'
    }

    let state = State.isAwaitingFile
   
    if ( postRequest?.state === 'pending' ) {
        state = State.isPreparingUpload
    } 
    else if ( postRequest?.state === 'fulfilled' && ! uploadRequest )  {
        state = State.isPendingUpload
    }

    let fileErrorView = [] 
    for(const error of fileError) {
        fileErrorView.push( <Alert key={error.id} type="error" timeout={5000}>{ error.message }</Alert> )
    }

    let icon = ( <PhotoIcon /> )
    if ( kind === 'video' ) {
        icon = ( <VideoCameraIcon /> )
    }

    // Perform the render.
    return (
        <div className="file-upload">
            { state === State.isPreparingUpload && <div><Spinner local={true} /> <span>Preparing the upload...</span></div> }
            { state === State.isPendingUpload && <div><Spinner local={true} /> <span>Upload prepared. Upload will begin shortly...</span></div> }
            { state === State.isUploading && <div><Spinner local={true} /> <span>Uploading.  Do not navigate away.  This might take a several minutes...</span></div> }
            { state === State.isProcessing && kind === 'image' && <div><Spinner local={true} /> <span>Processing. Do not navigate away. { job ? `${job.progress.progress}% complete.` : '' }  This might take a several minutes..</span></div> }
            { state === State.isProcessing && kind === 'video' && <div><Spinner local={true} /> <span>Processing. Do not navigate away. This might take several minutes...</span></div> }
            { state === State.isAwaitingFile && <div className="upload-input">
                <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}>{ icon } <span className="file-upload-button-text"> { text ? text : 'Upload Image' }</span></Button>
            </div> }
            <input type="file"
                name="file"
                accept={allowedTypes.join(',')}
                multiple={maxFiles > 1 ? true : false}
                onChange={onChangeInternal} 
                style={{ display: 'none' }}
                ref={hiddenFileInput}
            />
            <RequestErrorModal message="Attempt to initialize upload" request={postRequest} onContinue={onErrorInternal} />
            <RequestErrorModal message="Attempt to upload file" request={uploadRequest} onContinue={onErrorInternal} />
            { fileErrorView }
        </div>
    )
}

export default FileUploadInput 
