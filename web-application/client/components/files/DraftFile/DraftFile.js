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
import { useRequest } from '/lib/hooks/useRequest'

import { XMarkIcon } from '@heroicons/react/16/solid'

import logger from '/logger'

import { deleteFile } from '/state/File'

import { useFile } from '/lib/hooks/File'
import { useJob } from '/lib/hooks/Job'
import { useEventSubscription } from '/lib/hooks/useEventSubscription'

import File from '/components/files/File'

import JobError from '/components/errors/JobError'
import Spinner from '/components/Spinner'

import "./DraftFile.css"

const DraftFile = function({ 
    fileId, width, 
    onRemove, deleteOnRemove,
    onDragStart, onDrag, onDragEnd, 
    onDragEnter, onDragOver, onDragLeave, 
    onDrop
}) {

    const [file, fileRequest, refreshFile] = useFile(fileId)

    let type = file ? file.type.split('/')[0] : 'image'
    let queue = 'resize-image'
    if ( type === 'video' ) {
        queue = 'process-video'
    }

    const [job, jobRequest] = useJob(queue, file?.jobId)
    useEventSubscription('Job', 'update', { queue: queue, jobId: file?.jobId }, { skip: ! file?.jobId })
  
    const [ jobError, setJobError ] = useState(null)
    const [request, makeRequest] = useRequest()

    const remove = function() {
        onRemove(fileId)

        if ( deleteOnRemove !== false ) {
            makeRequest(deleteFile(fileId))
        }
    }

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

    // ============ Render ====================================================
    //
  
    if ( fileId === undefined || fileId === null ) {
        return null
    }

    if ( ( file === undefined || file === null ) && ( request === null || request?.state === 'pending') ) {
        return (
            <div className="draft-file">
                <Spinner />
            </div>
        )
    }

    if ( ( file === undefined || file === null ) && request?.state !== 'fulfilled' ) {
        return (
            <div className="draft-file">
                <p>Failed to load file.</p>
                <Button type="warn" onClick={() => refreshFile()}>Retry</Button>
            </div>
        )
    }

    const State = {
        isPreparingUpload: 'isPreparingUpload',
        isPendingUpload: 'isPendingUpload',
        isUploading: 'isUploading',
        isProcessing: 'isProcessing',
        isAwaitingFile: 'isAwaitingFile',
        isReady: 'isReady'
    }

    let state = State.isAwaitingFile
 
    if ( fileId === '0e65167b-006c-4167-88b7-d70c8787ed37' ) {
        console.log(`DraftFile -- File: `, file)
    }
    if ( file.state === 'pending' ) {
        state = State.isUploading
    } else if ( file.state === 'processing' ) {
        state = State.isProcessing
    } else if ( file.state === 'ready' ) {
        state = State.isReady
    }

    let renderWidth = width ? width : 650
    let draggable = (onDragStart !== undefined && onDragStart !== null)
        || (onDrag !== undefined && onDrag !== null)
        || (onDragEnd !== undefined && onDragEnd !== null)
        || (onDragEnter !== undefined && onDragEnter !== null)
        || (onDragOver !== undefined && onDragOver !== null)
        || (onDragLeave !== undefined && onDragLeave !== null)
        || (onDrop !== undefined && onDrop !== null)
    return (
        <div 
            className="draft-file" 
            draggable={draggable} 
            onDragStart={onDragStart} 
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            { state === State.isPreparingUpload && <div><Spinner local={true} /> <span>Preparing the upload...</span></div> }
            { state === State.isPendingUpload && <div><Spinner local={true} /> <span>Upload prepared. Upload will begin shortly...</span></div> }
            { state === State.isUploading && <div><Spinner local={true} /> <span>Uploading.  Do not navigate away.  This might take a several minutes...</span></div> }
            { state === State.isProcessing && <div><Spinner local={true} /> <span>Processing. Do not navigate away. { job ? `${job.progress.progress}% complete.` : '' }  This might take a several minutes..</span></div> }
            { state === State.isReady && <div className="draft-file__file">
                <a className="draft-file__remove" href="" onClick={(e) => { e.preventDefault(); remove() }}><XMarkIcon /></a>
                <File id={fileId} width={renderWidth} type={type}  />
            </div> }
        </div>
    )
}

export default DraftFile
