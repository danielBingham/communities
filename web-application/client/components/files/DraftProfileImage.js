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
import { useState, useEffect, useRef, useImperativeHandle } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { ReactCrop } from 'react-image-crop'

import { useRequest } from '/lib/hooks/useRequest'

import { useFile } from '/lib/hooks/File'
import { useJob } from '/lib/hooks/Job'
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import {  patchFile, deleteFile, removeRequest as removeFileRequest  } from '/state/File'
import { removeRequest } from '/state/requests'

import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'
import File from '/components/files/File'
import ProgressBar from '/components/ProgressBar'
import Alert from '/components/ui/Alert'

import "react-image-crop/dist/ReactCrop.css"
import "./DraftProfileImage.css"

const State = {
    isAwaitingFile: 'isAwaitingFile',
    isPreparingUpload: 'isPreparingUpload',
    isPendingUpload: 'isPendingUpload',
    isUploading: 'isUploading',
    isProcessing: 'isProcessing',
    isFailedLoad: 'isFailedLoad',
    isFailedUpload: 'isFailedUploading',
    isFailedProcess: 'isFailedProcessing',
    isReady: 'isReady',
}

const DraftProfileImage = function({ 
    ref,
    fileId, setFileId, 
    width, 
    deleteOnRemove,
    onError,
    onProcessingSuccess,
    onCropSuccess,
    onRemove
}) {

    const uploadInfo = useSelector((state) => fileId in state.File.requests ? state.File.requests[fileId] : null)
    const uploadRequest = useSelector((state) => uploadInfo?.requestId in state.requests.dictionary ? state.requests.dictionary[uploadInfo?.requestId] : null)

    const [file, fileRequest, refreshFile] = useFile(fileId)
    const [job, jobRequest] = useJob('resize-image', file?.jobId)
    useEventSubscription(file?.jobId ? `Job-update-resize-image-${file.jobId}` : null, 
        'Job', 'update', { queue: 'resize-image', jobId: file?.jobId }, { skip: ! file?.jobId })

    const [ dimensions, setDimensions ] = useState({
        width: 1,
        height: 1 
    })
    const [ crop, setCrop] = useState({
        unit: 'px',
        x: 0,
        y: 0,
        width: width,
        height: width 

    })
    const [isLoaded, setIsLoaded] = useState(false)
    const [isCropping, setIsCropping] = useState(false)

    const [ request, makeRequest, resetRequest ] = useRequest()
    const imageRef = useRef(null)

    const dispatch = useDispatch()

    const remove = function() {
        setFileId(null)

        if ( deleteOnRemove !== false ) {
            makeRequest(deleteFile(fileId))
        }

        if ( onRemove ) {
            onRemove()
        }
    }

    const onErrorInternal = function() {
        resetRequest()
        remove()

        if ( onError ) {
            onError()
        }
    }

    const onLoad = function(event) {
        const img = event.target
        if ( dimensions.width != img.clientWidth || dimensions.height != img.clientHeight ) {
            setDimensions({ 
                width: img.clientWidth,
                height: img.clientHeight
            })
        }

        const newCrop = { ...crop }
        if ( img.clientWidth < crop.width ) {
            newCrop.width = img.clientWidth
            newCrop.height = img.clientWidth
        }

        if ( img.clientHeight < newCrop.height ) {
            newCrop.height = img.clientHeight
            newCrop.width = img.clientHeight
        }

        if ( newCrop.width !== crop.width || newCrop.height !== crop.height ) {
            setCrop(newCrop)
        }

        setIsLoaded(true)
    }

    useImperativeHandle(ref, () => {
        return {
            submit: function() {
                makeRequest(patchFile(fileId, { crop: crop, dimensions: dimensions }))
                setIsCropping(true)
            }
        }
    }, [ fileId, crop, dimensions ])

    useEffect(function() {
        if ( imageRef.current !== null && isLoaded) {
            const img = imageRef.current
            if ( dimensions.width != img.clientWidth || dimensions.height != img.clientHeight ) {
                setDimensions({ 
                    width: img.clientWidth,
                    height: img.clientHeight
                })
            }

            const newCrop = { ...crop }
            if ( img.clientWidth < crop.width ) {
                newCrop.width = img.clientWidth
                newCrop.height = img.clientWidth
            }

            if ( img.clientHeight < newCrop.height ) {
                newCrop.height = img.clientHeight
                newCrop.width = img.clientHeight
            }

            if ( newCrop.width !== crop.width || newCrop.height !== crop.height ) {
                setCrop(newCrop)
            }
        }
    }, [ crop, isLoaded] )

    useEffect(function() {
        // Reset the crop once we're done cropping so that it doesn't appear
        // outside the image if the draft is still shown.
        //
        // Also bust the cache.
        //
        // The draft image will still be shown in UserProfileEditForm.
        if ( request?.state == 'fulfilled' ) {
            setCrop({
                unit: 'px',
                x: 0,
                y: 0,
                width: width,
                height: width
            })
            refreshFile()
        } else if ( request?.state === 'failed' ) {
            setCrop({
                unit: 'px',
                x: 0,
                y: 0,
                width: width,
                height: width
            })

            refreshFile()

            if ( onError ) {
                onError()
            }
        }
    }, [ request ])

    useEffect(function() {
        if ( job?.progress?.step === 'complete') { 
            refreshFile()

            if ( isCropping && onCropSuccess) {
                setIsCropping(false)
                onCropSuccess()
            } else if ( onProcessingSuccess ) {
                onProcessingSuccess()
            }
        } else if ( job?.finishedOn !== null ) {
            refreshFile()
        }
    }, [ job?.progress?.step ])

    useEffect(() => {
        return () => {
            // If we're unmounting and we have a succeeded request, clean it
            // up.  We don't need it anymore.
            //
            if ( uploadRequest.state === 'failed' || uploadRequest.state === 'fulfilled' ) {
                dispatch(removeRequest(uploadRequest))
                dispatch(removeFileRequest({ filleId: fileId }))
            }
        }
    }, [ uploadRequest ])

    // ============ Render ====================================================
  
    let stateInternal = State.isAwaitingFile
    let alertMessage = ''

    if ( fileId === undefined || fileId === null ) {
        return null
    }

    if ( ( file === undefined || file === null ) && ( fileRequest === null || fileRequest?.state === 'pending') ) {
        return (
            <div className="draft-profile-image">
                <Spinner />
            </div>
        )
    }

    if ( file !== undefined && file !== null ) {
        if ( file.state === 'pending' ) {
            stateInternal = State.isUploading
        } else if ( file.state === 'processing' ) {
            stateInternal = State.isProcessing
        } else if ( file.state === 'ready' ) {
            stateInternal = State.isReady
        } else if ( file.state === 'error' ) {
            stateInternal = State.isFailedProcess
        }
    }

    if ( ( file === undefined || file === null ) && fileRequest?.state !== 'fulfilled' ) {
        stateInternal = State.isFailedLoad
    }

    if ( uploadRequest?.state === 'failed' ) {
        if ( uploadRequest.error.type === 'upload-error:file-size' ) {
            alertMessage = (<span>'{uploadInfo.fileName}' failed to upload. { uploadRequest.error?.message }</span>)
        } else {
            alertMessage = (<span>'{uploadInfo.fileName}' failed to upload.  Please try again or try a different file.</span>)
        }
        stateInternal = State.isFailedUpload
    }

    if ( job !== null && job !== undefined  ) {
        if ( job.progress?.step === 'failed' && job.attemptsMade >= job.opts?.attempts ) {
            alertMessage = (<span>{ job.progress?.stepDescription ? job.progress.stepDescription : 'File failed to process.  This could be because the file was corrupted or invalid in some way.' }</span>)
            stateInternal = State.isFailedProcess
        }
    }

    if ( request?.state === 'failed' ) {
        if ( 'error' in request && request.error !== undefined && request.error !== null && typeof request.error === 'object' ) {
            alertMessage = (<span>Failed to crop image. The image file may be corrupted or invalid in some way.</span>)
            stateInternal = State.isFailedProcess

            if ( request.error.type === 'invalid' ) {
                alertMessage = (<span>Crop dimensions were invalid.  Try re-uploading and re-positioning the crop.</span>)
            } else if ( request.error.type === 'network-error' ) {
                alertMessage = (<span>A temporary network error occurred while cropping. If the error persists, please contact support.</span>)
            } 
        }
    }

    let style = {}
    if ( ! isLoaded )  {
        style = {
            position: 'absolute',
            top: '-10000px',
            left: '-10000px'
        }
    }

    return (
        <div className="draft-profile-image">
            { stateInternal === State.isPreparingUpload && <div><Spinner local={true} /> <span>Preparing the upload...</span></div> }
            { stateInternal === State.isPendingUpload && <div><Spinner local={true} /> <span>Upload prepared. Upload will begin shortly...</span></div> }
            { stateInternal === State.isUploading && 
                <div className="draft-profile-image__file">
                    <div className="draft-profile-image__pending">
                        <div className="draft-profile-image__pending-progress">
                            <Spinner local={true} /> <span>Uploading.  Do not navigate away.  This might take several minutes...</span>
                        </div> 
                    </div>
                    <div className="draft-profile-image__buttons">
                        <Button onClick={(e) => { e.preventDefault(); remove() }}>Remove Image</Button>
                    </div>
                </div>
            }
            { stateInternal === State.isProcessing && 
                <div className="draft-profile-image__file">  
                    <div className="draft-profile-image__pending">
                        <div className="draft-profile-image__pending-progress">
                            <p>Processing. Do not navigate away. This might take several minutes...</p>
                            <ProgressBar progress={ job ? job.progress.progress : 0 } />
                        </div>
                    </div>
                    <div className="draft-profile-image__buttons">
                        <Button onClick={(e) => { e.preventDefault(); remove() }}>Remove Image</Button>
                    </div>
                </div> 
            }
            { stateInternal === State.isFailedLoad &&
                <>
                    <div className="draft-profile-image__failed-load">
                        <p>Failed to load file.</p>
                        <Button type="warn" onClick={() => refreshFile()}>Retry</Button>
                    </div>
                    <div className="draft-profile-image__buttons">
                        <Button onClick={(e) => { e.preventDefault(); remove() }}>Remove Image</Button>
                    </div>
                </>
            }
            { ( stateInternal === State.isFailedUpload || stateInternal === State.isFailedProcess ) &&
                    <>
                        <Alert type="error" timeout={5000} onClear={() => onErrorInternal() }>{ alertMessage }</Alert> 
                        <div className="draft-profile-image">
                            <div className="draft-profile-image__failed-load">
                                <div className="draft-profile-image__failed-load__inner">
                                    <p>{ stateInternal === State.isFailedUpload ? 'Image failed to upload.' : 'Failed to process image.' }</p>
                                </div>
                            </div>
                            <div className="draft-profile-image__buttons">
                                <Button onClick={(e) => { e.preventDefault(); remove() }}>Remove Image</Button>
                            </div>
                        </div>
                    </>
            }
            { stateInternal === State.isReady && 
                <>
                    <div className={`draft-profile-image__file-wrapper`} style={style}>
                        <ReactCrop 
                            crop={crop} 
                            onChange={(crop) => setCrop(crop)} aspect={1}
                            keepSelection={true}
                            minWidth={10}
                            minHeight={10}
                            circularCrop={true}
                        >
                            <File ref={imageRef} onLoad={onLoad} id={fileId} type="image" />
                        </ReactCrop>
                    </div>
                    { ! isLoaded && <Spinner /> }
                    <div className="draft-profile-image__buttons">
                        <Button onClick={(e) => { e.preventDefault(); remove() }}>Remove Image</Button>
                    </div>
                </>
            }
        </div>
    )
}

export default DraftProfileImage 
