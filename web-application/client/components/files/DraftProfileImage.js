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
import { useSelector } from 'react-redux'

import { ReactCrop } from 'react-image-crop'

import { XMarkIcon, PhotoIcon } from '@heroicons/react/16/solid'

import { useRequest } from '/lib/hooks/useRequest'

import { useFile } from '/lib/hooks/File'
import { useJob } from '/lib/hooks/Job'
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import {  patchFile, deleteFile } from '/state/File'

import { RequestErrorModal } from '/components/errors/RequestError'
import JobError from '/components/errors/JobError'

import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'
import File from '/components/files/File'
import ProgressBar from '/components/ProgressBar'

import "react-image-crop/dist/ReactCrop.css"
import "./DraftProfileImage.css"

const State = {
    isAwaitingFile: 'isAwaitingFile',
    isPreparingUpload: 'isPreparingUpload',
    isPendingUpload: 'isPendingUpload',
    isUploading: 'isUploading',
    isProcessing: 'isProcessing',
    isReady: 'isReady'
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

    const [ request, makeRequest ] = useRequest()
    const imageRef = useRef(null)

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
        }
    }, [ job?.progress?.step ])

    // ============ Render ====================================================
  
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

    if ( ( file === undefined || file === null ) && fileRequest?.state !== 'fulfilled' ) {
        return (
            <div className="draft-profile-image">
                <p>Failed to load file.</p>
                <Button type="warn" onClick={() => refreshFile()}>Retry</Button>
            </div>
        )
    }

    let stateInternal = State.isAwaitingFile
 
    if ( file.state === 'pending' ) {
        stateInternal = State.isUploading
    } else if ( file.state === 'processing' ) {
        stateInternal = State.isProcessing
    } else if ( file.state === 'ready' ) {
        stateInternal = State.isReady
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
            <RequestErrorModal message={'Attempt to crop your profile'} request={request} onContinue={() => onErrorInternal()} />
            <JobError message={'File processing'} job={job} onContinue={() => onErrorInternal()} />
        </div>
    )
}

export default DraftProfileImage 
