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

import {  PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

import { uploadImage, uploadVideo } from '/state/File'

import { useRequest } from '/lib/hooks/useRequest'

import { RequestErrorModal } from '/components/errors/RequestError'
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
    //
    
    const onChange = function(event) {
        const uploadedFileData = event.target.files[0]
        if ( ! props.types.includes(uploadedFileData.type) ) {
            setTypeError('invalid-type')
            return
        }

        if ( props.type === 'image' ) {
            makeUploadRequest(uploadImage(uploadedFileData))
        } else if ( props.type === 'video' ) {
            makeUploadRequest(uploadVideo(uploadedFileData))
        } else {
            throw new Error(`Invalid file type: ${props.type}.`)
        }
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
        content = ( <><Spinner local={true} /> <span>Uploading.  This might take a while...</span></> )
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
            <RequestErrorModal message="Attempt to upload file" request={uploadRequest} />
        </div>
    )
}

export default FileUploadInput 
