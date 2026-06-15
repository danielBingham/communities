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
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { XMarkIcon, PhotoIcon } from '@heroicons/react/16/solid'

import logger from '/logger'

import { deleteFile, removeRequest as removeFileRequest } from '/state/File'
import { removeRequest } from '/state/requests'

import { useFile } from '/lib/hooks/File'
import { useJob } from '/lib/hooks/Job'
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import File from '/components/files/File'

import JobError from '/components/errors/JobError'

import Spinner from '/components/Spinner'
import Button from '/components/ui/Button'
import ProgressBar from '/components/ProgressBar'
import Alert from '/components/ui/Alert'

import "./DraftFile.css"

const State = {
    isAwaitingFile: 'isAwaitingFile',
    isPreparingUpload: 'isPreparingUpload',
    isPendingUpload: 'isPendingUpload',
    isUploading: 'isUploading',
    isProcessing: 'isProcessing',
    isReady: 'isReady'
}

const DraftFile = function({ 
    fileId, width, 
    onRemove, deleteOnRemove
}) {

    const uploadInfo = useSelector((state) => fileId in state.File.requests ? state.File.requests[fileId] : null)
    const uploadRequest = useSelector((state) => uploadInfo?.requestId in state.requests.dictionary ? state.requests.dictionary[uploadInfo?.requestId] : null)

    const [file, fileRequest, refreshFile] = useFile(fileId)

    let type = file ? file.type.split('/')[0] : 'image'
    let queue = 'resize-image'
    if ( type === 'video' ) {
        queue = 'process-video'
    }

    const [job, jobRequest] = useJob(queue, file?.jobId)
    useEventSubscription(file?.jobId ? `Job-update-${queue}-${file.jobId}` : null, 
        'Job', 'update', { queue: queue, jobId: file?.jobId }, { skip: ! file?.jobId })

    const [isLoaded, setIsLoaded] = useState(false)
    const [loadFailed, setLoadFailed] = useState(false)

    const [deleteRequest, makeDeleteRequest] = useRequest()

    const dispatch = useDispatch()

    const remove = function() {
        onRemove(fileId)

        if ( deleteOnRemove !== false ) {
            makeDeleteRequest(deleteFile(fileId))
        }
    }

    useEffect(function() {
        if ( job?.progress?.step === 'complete') { 
            refreshFile()
        } else if ( job?.finishedOn !== null ) {
            refreshFile()
        }
    }, [ job ])

    // ============ Render ====================================================
    //
  
    if ( fileId === undefined || fileId === null ) {
        return null
    }

    if ( ( file === undefined || file === null ) && ( fileRequest === null || fileRequest?.state === 'pending') ) {
        return (
            <div className="draft-file">
                <Spinner />
            </div>
        )
    }

    if ( ( file === undefined || file === null ) && fileRequest?.state !== 'fulfilled' ) {
        return (
            <div className="draft-file">
                <div className="draft-file__file">
                    <a className="draft-file__remove" href="" role="button" aria-label="Remove file" onClick={(e) => { e.preventDefault(); remove() }}><XMarkIcon /></a>
                    <div className="draft-file__failed-load">
                        <div>
                            <p>Failed to load file.</p>
                            <Button type="warn" onClick={() => refreshFile()}>Retry</Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if ( uploadRequest?.state === 'failed' ) {
        if ( uploadRequest.error.type === 'upload-error:file-size' ) {
            return ( <Alert type="error" timeout={5000} onClear={() => remove() }>'{uploadInfo.fileName}' failed to upload. { uploadRequest.error?.message }</Alert>)
        } else {
            return ( <Alert type="error" timeout={5000} onClear={() => remove() }>'{uploadInfo.fileName}' failed to upload.  Please try again or try a different file.</Alert>)
        }
    }

    if ( job !== null && job !== undefined  ) {
        if ( job.progress?.step === 'failed' && job.attemptsMade >= job.opts?.attempts ) {
            return ( <Alert type="error" timeout={5000} onClear={() => remove() }>{ job.progress?.stepDescription ? job.progress.stepDescription : 'File failed to process.  This could be because the file was corrupted or invalid in some way.' }</Alert> )
        }
    }


    let state = State.isAwaitingFile
 
    if ( file.state === 'pending' ) {
        state = State.isUploading
    } else if ( file.state === 'processing' ) {
        state = State.isProcessing
    } else if ( file.state === 'ready' ) {
        state = State.isReady
    }

    let renderWidth = width ? width : 650
    return (
        <div className="draft-file" >
            { state === State.isPreparingUpload && <div><Spinner local={true} /> <span>Preparing the upload...</span></div> }
            { state === State.isPendingUpload && <div><Spinner local={true} /> <span>Upload prepared. Upload will begin shortly...</span></div> }
            { state === State.isUploading && 
                <div className="draft-file__file">
                    <a className="draft-file__remove" href="" role="button" aria-label="Remove file" onClick={(e) => { e.preventDefault(); remove() }}><XMarkIcon /></a>
                    <div className="draft-file__pending">
                        <div>
                            <Spinner local={true} /> <span>Uploading.  Do not navigate away.  This might take several minutes...</span>
                        </div> 
                    </div>
                </div>
            }
            { state === State.isProcessing && 
                <div className="draft-file__file">  
                    <a className="draft-file__remove" href="" role="button" aria-label="Remove file" onClick={(e) => { e.preventDefault(); remove() }}><XMarkIcon /></a>
                    <div className="draft-file__pending">
                        <div>
                            <p>Processing. Do not navigate away. This might take several minutes...</p>
                            <ProgressBar progress={ job?.progress?.progress ?? 0 } />
                        </div>
                    </div>
                </div> 
            }
            { state === State.isReady && 
                <div className="draft-file__file">
                    { (isLoaded || loadFailed) && <a className="draft-file__remove" href="" role="button" aria-label="Remove file" onClick={(e) => { e.preventDefault(); remove() }}><XMarkIcon /></a> }
                    { loadFailed && <div className="draft-file__failed-load">
                        <div>
                            <p>Failed to load image.</p>
                            <p><PhotoIcon /></p>
                        </div>
                    </div> }
                    { ! loadFailed && <File id={fileId} width={renderWidth} onLoad={() => setIsLoaded(true)} onError={() => setLoadFailed(true)} type={type}  /> }
                </div> 
            }
            <JobError message={'File processing'} job={job} onContinue={() => remove() } />
        </div>
    )
}

export default DraftFile
