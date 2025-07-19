import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import './Image.css'

const Image = function({ id, src, width }) {
    const [isLoading, setIsLoading] = useState(true)
    const configuration = useSelector((state) => state.system.configuration)

    if ( ! id && ! src) {
        console.error(new Error(`One of 'props.src' or 'props.id' is required!`))
        return null
    }

    let url = ''
    if ( src !== undefined && src !== null ) {
        url = src
    } else if ( id !== undefined && id !== null ) {
        url = `${configuration.backend}/file/${id}`
    }

    const style = isLoading ? { position: 'absolute', top: '-10000px', left: '-10000px' } : {}
    const widthSelector = width ? `?width=${width}` : ''
    return (
        <div>
            <img 
                onLoad={(e) => setIsLoading(false)} 
                style={style}
                src={`${url}${widthSelector}`} 
            />
            { isLoading && <div className="image__loading">
                <Spinner /> 
            </div> }
        </div>
    )
}

export default Image 
