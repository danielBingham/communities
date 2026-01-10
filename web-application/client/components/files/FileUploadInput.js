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
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import { RequestErrorModal } from '/components/errors/RequestError'
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

    useEventSubscription('Job', 'update', { jobId: file?.jobId }, { skip: ! file?.jobId })

    const job = useSelector((state) => file && file.jobId && file.jobId in state.jobs.dictionary ? state.jobs.dictionary[file.jobId] : null)
    const [ typeError, setTypeError ] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    
    const hasVideoUploads = useFeature('issue-67-video-uploads')

    const hiddenFileInput = useRef(null)

    const [postRequest, makePostRequest] = useRequest()
    const [uploadRequest, makeUploadRequest] = useRequest()
    
    const onChangeInternal = function(event) {
        const uploadedFileData = event.target.files[0]
        if ( ! types.includes(uploadedFileData.type) ) {
            setTypeError('invalid-type')
            return
        }

        setUploadedFile(uploadedFileData)

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

    useEffect(function() {
        if ( postRequest?.state === 'fulfilled' ) {
            const createdFile = postRequest.response.body.entity
            setFileId(createdFile.id)

            if ( type === 'image' ) {
                makeUploadRequest(uploadImage(createdFile.id, uploadedFile))
            } else if ( type === 'video' ) {
                makeUploadRequest(uploadVideo(createdFile.id, uploadedFile))
            } 

            if ( onChange ) {
                onChange(uploadedFile.id)
            }
        }
    }, [ postRequest ])

    useEffect(function() {
        if ( job && job.finishedOn !== null ) { 
            refreshFile()
        }
    }, [ job ])

    // ============ Render ==========================================

    if ( type !== 'image' && type !== 'video' ) {
        throw new Error(`Invalid FileUpload type, '${type}'.`)
    }

    console.log(`File: `, file, 
        `\npostRequest: `, postRequest,
        `\nuploadRequest: `, uploadRequest)
    let content = null
    // Spinner while we create the file.
    if ( postRequest?.state === 'pending' ) {
        content = ( <><Spinner local={true} /> <span>Preparing the upload...</span></> )
    } 
    else if ( postRequest?.state === 'fulfilled' && ! uploadRequest )  {
        content = ( <><Spinner local={true} /> <span>Upload prepared. Upload will begin shortly...</span></> )
    }
    // Spinner while we wait for requests to process so that we can't start a new request on top of an existing one.
    else if ( uploadRequest?.state == 'pending' ) {
        content = ( <><Spinner local={true} /> <span>Uploading.  This might take a while...</span></> )
    }
    else if ( file?.state === 'processing' ) {
        content = ( <><Spinner local={true} /> <span>Processing. { job ? `${job.progress.progress}% complete.` : '' }  This might take a while...</span></> )
    } else { 
        let typeErrorView = null
        if ( typeError ) {
            typeErrorView = ( <div className="error">Invalid-type selected.  Supported types are: { types.join(',') }.</div> )
        }
   
        let icon = ( <PhotoIcon /> )
        if ( type === 'video' ) {
            icon = ( <VideoCameraIcon /> )
        }

        content = (
            <div className="upload-input">
                <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}>{ icon } <span className="file-upload-button-text"> { text ? text : 'Upload Image' }</span></Button>
                <input type="file"
                    name="file"
                    accept={types.join(',')}
                    onChange={onChangeInternal} 
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
            <RequestErrorModal message="Attempt to upload file" request={uploadRequest} />
        </div>
    )
}

export default FileUploadInput 
