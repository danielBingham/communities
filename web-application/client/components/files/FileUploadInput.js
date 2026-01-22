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

import {  PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

import { uploadImage, uploadVideo, postFiles } from '/state/File'


import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'
import { useFile } from '/lib/hooks/File'
import { useJob } from '/lib/hooks/Job'
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import { RequestErrorModal } from '/components/errors/RequestError'
import JobError from '/components/errors/JobError'

import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './FileUploadInput.css'

/**
 * TODO If a page showing this component is reloaded after a file has been
 * chosen, that file is left hanging in the database and on disk.  It's
 * effectively orphaned.  We should fix that.
 */
const FileUploadInput = function({ text, fileId, setFileId, type, types, onChange }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [file, fileRequest, refreshFile] = useFile(fileId)

    let queue = 'resize-image'
    if ( type === 'video' || ( type !== 'image' && file?.kind === 'video')) {
        queue = 'process-video'
    }

    const [job, jobRequest] = useJob(queue, file?.jobId)
    useEventSubscription('Job', 'update', { queue: queue, jobId: file?.jobId }, { skip: ! file?.jobId })

    const [ jobError, setJobError ] = useState(null)
    const [ typeError, setTypeError ] = useState(null)
    
    const hasVideoUploads = useFeature('issue-67-video-uploads')

    const hiddenFileInput = useRef(null)

    const [postRequest, makePostRequest] = useRequest()
    const [uploadRequest, makeUploadRequest] = useRequest('FileUploadInput')
    
    const onChangeInternal = function(event) {
        if ( event.target.files.length <= 0 ) {
            return
        }

        const uploadedFileData = event.target.files[0]
        if ( ! types.includes(uploadedFileData.type) ) {
            setTypeError('invalid-type')
            return
        }

        const newFile = {
            userId: currentUser.id,
            type: uploadedFileData.type
        }

        if ( hasVideoUploads === true ) {
            newFile.kind = type
            newFile.state = 'pending'
            newFile.mimetype = uploadedFileData.type
        }

        makePostRequest(postFiles(newFile))
    }

    const onError = function() {
        setFileId(null)
        if ( hiddenFileInput.current !== null && hiddenFileInput.current !== undefined) {
            hiddenFileInput.current.value = null
        }
    }

    useEffect(function() {
        if ( postRequest?.state === 'fulfilled' ) {
            const createdFile = postRequest.response.body.entity
            setFileId(createdFile.id)

            const fileData = hiddenFileInput.current.files[0]
            if ( type === 'image' ) {
                makeUploadRequest(uploadImage(createdFile.id, fileData))
            } else if ( type === 'video' ) {
                makeUploadRequest(uploadVideo(createdFile.id, fileData))
            } 

            if ( onChange ) {
                onChange(createdFile.id)
            }
        }
    }, [ postRequest ])

    useEffect(function() {
        if ( job && job.progress.step === 'complete') { 
            if ( job.progress.step === 'complete' ) {
                refreshFile()
            } else if ( job.finishedOn !== null ) {
                refreshFile()
            } else if ( job.failedReason !== null ) {
                setJobError('Attempt to process file failed with an error.')
            }
        }
    }, [ job ])

    // ============ Render ==========================================

    if ( type !== 'image' && type !== 'video' ) {
        throw new Error(`Invalid FileUpload type, '${type}'.`)
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
    else if ( uploadRequest?.state === 'pending' ) {
        state = State.isUploading
    }
    else if ( file?.state === 'pending' ) {
        state = State.isUploading
    }
    else if ( file?.state === 'processing' ) {
        state = State.isProcessing
    } 

    let typeErrorView = null
    if ( typeError ) {
        typeErrorView = ( <div className="error">Invalid-type selected.  Supported types are: { types.join(',') }.</div> )
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
            { state === State.isUploading && <div><Spinner local={true} /> <span>Uploading.  This might take a while...</span></div> }
            { state === State.isProcessing && type === 'image' && <div><Spinner local={true} /> <span>Processing. { job ? `${job.progress.progress}% complete.` : '' }  This might take a while...</span></div> }
            { state === State.isProcessing && type === 'video' && <div><Spinner local={true} /> <span>Processing. This might take a while...</span></div> }
            { state === State.isAwaitingFile && <div className="upload-input">
                <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}>{ icon } <span className="file-upload-button-text"> { text ? text : 'Upload Image' }</span></Button>
                { typeErrorView }
            </div> }
            <input type="file"
                name="file"
                accept={types.join(',')}
                onChange={onChangeInternal} 
                style={{ display: 'none' }}
                ref={hiddenFileInput}
            />
            <RequestErrorModal message="Attempt to initialize upload" request={postRequest} onContinue={onError} />
            <RequestErrorModal message="Attempt to upload file" request={uploadRequest} onContinue={onError} />
            <JobError message="Attempt to process file" job={job} onContinue={onError} />
        </div>
    )
}

export default FileUploadInput 
