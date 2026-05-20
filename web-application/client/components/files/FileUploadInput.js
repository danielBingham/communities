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

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'
import { useFile } from '/lib/hooks/File'
import { useJob } from '/lib/hooks/Job'
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import { RequestErrorModal } from '/components/errors/RequestError'
import JobError from '/components/errors/JobError'

import Spinner from '/components/Spinner'
import Button from '/components/ui/Button'
import Alert from '/components/ui/Alert'

import './FileUploadInput.css'

/**
 * TODO If a page showing this component is reloaded after a file has been
 * chosen, that file is left hanging in the database and on disk.  It's
 * effectively orphaned.  We should fix that.
 */
const FileUploadInput = function({ text, files, setFiles, type, types, onChange }) {
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

        let files = []
        let newFileMap = {}
        for(const uploadedFileData of event.target.files) {
            if ( ! types.includes(uploadedFileData.type) ) {
                setFileError([ `'${uploadedFileData.name}' was an invalid file type.  Supported types are: ${ types.join(',') }`, ...fileError ])
                continue 
            }

            if ( uploadedFileData.size <= 0 ) {
                setFileError([ `'${uploadedFileData.name}' was empty.`, ...fileError ])
                continue 
            }

            const newFile = {
                id: Uuid.v4(),
                userId: currentUser.id,
                type: uploadedFileData.type
            }

            if ( hasVideoUploads === true ) {
                newFile.kind = type
                newFile.state = 'pending'
                newFile.mimetype = uploadedFileData.type
            }

            newFileMap[uploadedFileData.name] = newFile.id

            files.push(newFile)
        }

        setFileMap({ ...fileMap, ...newFileMap })
        makePostRequest(postFiles(files))
    }

    const onError = function() {
        if ( hiddenFileInput.current !== null && hiddenFileInput.current !== undefined) {
            hiddenFileInput.current.value = null
        }
    }

    useEffect(function() {
        if ( postRequest?.state === 'fulfilled' ) {
            console.log(`Created files: `, postRequest)
            console.log(`Beginning upload with map: `, fileMap)
            for(const fileData of hiddenFileInput.current.files) {
                if ( ! ( fileData.name in fileMap ) ) {
                    logger.error(`File, '${fileData.name}', missing from fileMap.`)
                    continue
                }

                const id = fileMap[fileData.name]
                if ( type === 'image' ) {
                    makeUploadRequest(uploadImage(id, fileData))
                } else if ( type === 'video' ) {
                    makeUploadRequest(uploadVideo(id, fileData))
                } 
            }

            const createdFileIds = Object.keys(postRequest.response.body.dictionary)
            setFiles(createdFileIds)

            if ( onChange ) {
                onChange(createdFileIds)
            }
        }
    }, [ postRequest ])

    // ============ Render ==========================================

    if ( type !== 'image' && type !== 'video' ) {
        logger.error(`Invalid FileUpload type, '${type}'.`)
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
        fileErrorView.push( <Alert type="error" timeout={5000}>{ error }</Alert> )
    }

    let icon = ( <PhotoIcon /> )
    if ( type === 'video' ) {
        icon = ( <VideoCameraIcon /> )
    }


    // Perform the render.
    return (
        <div className="file-upload">
            { state === State.isPreparingUpload && <div><Spinner local={true} /> <span>Preparing the upload...</span></div> }
            { state === State.isPendingUpload && <div><Spinner local={true} /> <span>Upload prepared. Upload will begin shortly...</span></div> }
            { state === State.isUploading && <div><Spinner local={true} /> <span>Uploading.  Do not navigate away.  This might take a several minutes...</span></div> }
            { state === State.isProcessing && type === 'image' && <div><Spinner local={true} /> <span>Processing. Do not navigate away. { job ? `${job.progress.progress}% complete.` : '' }  This might take a several minutes..</span></div> }
            { state === State.isProcessing && type === 'video' && <div><Spinner local={true} /> <span>Processing. Do not navigate away. This might take several minutes...</span></div> }
            { state === State.isAwaitingFile && <div className="upload-input">
                <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}>{ icon } <span className="file-upload-button-text"> { text ? text : 'Upload Image' }</span></Button>
            </div> }
            <input type="file"
                name="file"
                accept={types.join(',')}
                multiple={ type === 'image' ? true : false }
                onChange={onChangeInternal} 
                style={{ display: 'none' }}
                ref={hiddenFileInput}
            />
            <RequestErrorModal message="Attempt to initialize upload" request={postRequest} onContinue={onError} />
            <RequestErrorModal message="Attempt to upload file" request={uploadRequest} onContinue={onError} />
            { fileErrorView }
        </div>
    )
}

export default FileUploadInput 
