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
import { useSelector, useDispatch } from 'react-redux'

import * as Uuid from 'uuid'

import {  PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { uploadImage, uploadVideo, postFiles, setRequest } from '/state/File'
import { makePersistedRequest } from '/state/requests'

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
    const fileMap = useRef({})

    const hiddenFileInput = useRef(null)

    const [postRequest, makePostRequest] = useRequest()

    const dispatch = useDispatch()
    
    const onChangeInternal = function(event) {
        if ( event.target.files.length <= 0 ) {
            return
        }

        // We're not returning here intentionally.  Instead we truncate the
        // set of files and upload a partial batch.
        if ( event.target.files.length > maxFiles ) {
            if ( onError ) {
                onError(createError(ErrorTypes.MaxFilesOverrun, `Too many files. You may not select more than ${maxFiles} more files.`))
            }
        }
        
        const errors = []
        let files = []
        fileMap.current = {}
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
                type: uploadedFileData.type,
                kind: kind ,
                mimetype: uploadedFileData.type,
                state: 'pending'
            }


            fileMap.current[index] = newFile.id
            files.push(newFile)
        }

        setFileError(errors)

        // If we didn't successfully upload any files, just bail.
        if ( files.length === 0 ) {
            return
        }

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

                if ( ! ( index in fileMap.current ) ) {
                    logger.error(`File, '${fileData.name}', missing from fileMap.`)
                    continue
                }

                const id = fileMap.current[index]
                if ( kind === 'image' ) {
                    const requestId = dispatch(makePersistedRequest(uploadImage(id, fileData)))
                    dispatch(setRequest({ requestId: requestId, fileId: id, fileName: fileData.name }))
                } else if ( kind === 'video' ) {
                    const requestId = dispatch(makePersistedRequest(uploadVideo(id, fileData)))
                    dispatch(setRequest({ requestId: requestId, fileId: id, fileName: fileData.name }))
                } 
            }

            const createdFileIds = Object.keys(postRequest.response.body.dictionary)

            if ( onChange ) {
                onChange(createdFileIds)
            }

            hiddenFileInput.current.value = null
        }
    }, [ postRequest ])

    // ============ Render ==========================================

    if ( kind !== 'image' && kind !== 'video' ) {
        logger.error(`Invalid FileUpload type, '${kind}'.`)
        return null
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
            <div className="upload-input">
                <Button type="primary" onClick={(e) => hiddenFileInput.current.click()}>{ icon } <span className="file-upload-button-text"> { text ? text : 'Upload Image' }</span></Button>
            </div> 
            <input type="file"
                name="file"
                accept={allowedTypes.join(',')}
                multiple={maxFiles > 1 ? true : false}
                onChange={onChangeInternal} 
                style={{ display: 'none' }}
                ref={hiddenFileInput}
            />
            <RequestErrorModal message="Attempt to initialize upload" request={postRequest} onContinue={onErrorInternal} />
            { fileErrorView }
        </div>
    )
}

export default FileUploadInput 
