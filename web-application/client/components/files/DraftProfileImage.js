import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { useSelector } from 'react-redux'

import { ReactCrop } from 'react-image-crop'

import { useRequest } from '/lib/hooks/useRequest'

import {  patchFile, deleteFile } from '/state/File'

import ErrorModal from '/components/errors/ErrorModal'
import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'
import Image from '/components/ui/Image'
import File from '/components/files/File'

import "react-image-crop/dist/ReactCrop.css"
import "./DraftProfileImage.css"

const DraftProfileImage = forwardRef(function({ 
    fileId, setFileId, 
    state, setState,
    width, 
    deleteOnRemove 
}, ref) {

    const system = useSelector((state) => state.system)

    const [ cacheBust, setCacheBust ] = useState(0)
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

    const [ request, makeRequest ] = useRequest()
    const imageRef = useRef(null)

    const remove = function() {
        setFileId(null)

        if ( deleteOnRemove !== false ) {
            makeRequest(deleteFile(fileId))
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
        if ( request && request.state !== state) {
            setState(request.state)
        }

        // Reset the crop once we're done cropping so that it doesn't appear
        // outside the image if the draft is still shown.
        //
        // Aslo bust the cache.
        //
        // The draft image will still be shown in UserProfileEditForm.
        if ( request && request.state == 'fulfilled' ) {
            setCacheBust(cacheBust+1)
            setCrop({
                unit: 'px',
                x: 0,
                y: 0,
                width: width,
                height: width
            })
        }
    }, [ request ])

    // ============ Render ====================================================
  
    let error = null
    if ( request && request.state == 'failed' ) {
        error = (
            <ErrorModal>
                <p>We failed to crop your image.  You could try again or try a different image.</p>
                <p>If you think this is a bug, telemetry has already been sent, but feel free to post in Communities Feedback and Discussion or email <a href="mailto:contact@communities.social">contact@communities.social</a></p>
            </ErrorModal>
        )
    }

    let content = null
    if ( fileId) {
        let style = {}
        if ( ! isLoaded )  {
            style = {
                position: 'absolute',
                top: '-10000px',
                left: '-10000px'
            }
        }
        content = (
            <>
            <div className={`file-wrapper`} style={style}>
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
            </>
        )
    }

    return (
        <div className="draft-profile-image">
            { error }
            { content }
            <div className="draft-profile-image__buttons">
                <Button onClick={(e) => { e.preventDefault(); remove() }}>Remove Image</Button>
            </div>
        </div>
    )
})

export default DraftProfileImage 
