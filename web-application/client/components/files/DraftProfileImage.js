import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { ReactCrop } from 'react-image-crop'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteFile } from '/state/files'

import Button from '/components/generic/button/Button'

import "react-image-crop/dist/ReactCrop.css"
import "./DraftProfileImage.css"

const DraftProfileImage = function({ fileId, setFileId, width, crop, setCrop, deleteOnRemove, isCropped}) {

    const [ imageWidth, setImageWidth ] = useState(0)
    const [ imageHeight, setImageHeight ] = useState(0)

    // ============ Request Tracking ==========================================
  
    const [request, makeRequest] = useRequest()

    // ============ Redux State ===============================================
    
    const configuration = useSelector((state) => state.system.configuration)

    // ============ Actions ===================================================

    const remove = function() {
        setFileId(null)

        if ( deleteOnRemove !== false ) {
            makeRequest(deleteFile(fileId))
        }
    }

    const onLoad = function(event) {
        const img = event.target
        setImageWidth(img.clientWidth)
        setImageHeight(img.clientHeight)
        console.log(`onLoad: ${img.clientWidth}, ${img.clientHeight}`)
    }

    // =========== Effect Handling ============================================

    useEffect(function() {
        const crop = {
            unit: 'px',
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            originalWidth: imageWidth,
            originalHeight: imageHeight
        }

        if ( imageWidth < 200 ) {
            crop.width = imageWidth 
        }

        if ( imageHeight < 200 ) {
            crop.height = imageHeight 
            crop.width = imageHeight
        }

        setCrop(crop)
    }, [ imageWidth, imageHeight] )

    // ============ Render ====================================================
    
    let content = null
    if ( fileId) {
        let renderWidth = width ? width : 200 
        content = (
            <div className={`file-wrapper ${ isCropped ? 'cropped' : ''}`}>
                <ReactCrop crop={crop} onChange={(crop) => setCrop(crop)} aspect={1}>
                    <img onLoad={onLoad} src={`${configuration.backend}/file/${fileId}?width=${renderWidth}&timestamp=${Date.now()}`} />
                </ReactCrop>
            </div>
        )
    }

    return (
        <div className="draft-profile-image">
            { content }
            <div className="draft-profile-image__buttons">
                <Button type="primary-warn" onClick={(e) => { e.preventDefault(); remove() }}>Remove Image</Button>
            </div>
        </div>
    )
}

export default DraftProfileImage 
