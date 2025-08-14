import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import './Image.css'

const Image = function({ id, src, width, ref, onLoad }) {
    const [imageUrl, setImageUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const configuration = useSelector((state) => state.system.configuration)

    const onLoadInternal = function(event) {
        setIsLoading(false)  

        console.log(`width: ${event.target.naturalWidth}, height: ${event.target.naturalHeight}`)
        if ( onLoad ) {
            onLoad(event)
        }
    }

    useEffect(function() {
        if ( ! id && ! src) {
            console.error(new Error(`One of 'props.src' or 'props.id' is required!`))
            return 
        }

        const widthSelector = width ? `?width=${width}` : ''

        let url = ''
        if ( src !== undefined && src !== null ) {
            url = src
        } else if ( id !== undefined && id !== null ) {
            url = `${configuration.host}${configuration.backend}/file/${id}${widthSelector}`
        }

        fetch(url).then(function(response) {
            return response.blob()
        }).then(function(imageBlob) {
            const imageObjectUrl = URL.createObjectURL(imageBlob)
            setImageUrl(imageObjectUrl)
        }).catch(function(error) {
            console.log(`Failed to retrieve image: ${url}`)
            console.error(error)
        })

    }, [ id, src, width])

    if ( ! id && ! src) {
        console.error(new Error(`One of 'props.src' or 'props.id' is required!`))
        return null
    }

    return (
        <>
            { imageUrl !== null && <img 
                ref={ref}
                onLoad={onLoadInternal} 
                src={`${imageUrl}`} 
            /> }
            { isLoading && <div className="image__loading">
                <Spinner /> 
            </div> }
        </>
    ) 
}

export default Image 
