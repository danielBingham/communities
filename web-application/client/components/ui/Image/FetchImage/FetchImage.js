import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { loadFile } from '/state/File'

import Spinner from '/components/Spinner'

const FetchImage = function({ id, src, width, ref, onLoad }) {
    const [isLoading, setIsLoading] = useState(true)
    const configuration = useSelector((state) => state.system.configuration)

    const widthSelector = width ? `?width=${width}` : ''

    let url = null 
    if ( src !== undefined && src !== null ) {
        url = src
    } else if ( configuration !== null && id !== undefined && id !== null ) {
        url = `${configuration.host}${configuration.backend}/file/${id}${widthSelector}`
    }

    const imageUrl = useSelector((state) => url !== null && url in state.File.cache ? state.File.cache[url] : null)

    const dispatch = useDispatch()

    const onLoadInternal = function(event) {
        setIsLoading(false)  

        if ( onLoad ) {
            onLoad(event)
        }
    }

    useEffect(function() {
        if ( ! id && ! src) {
            console.error(new Error(`One of 'props.src' or 'props.id' is required!`))
            return 
        }

        if ( imageUrl === null ) {
            dispatch(loadFile(url))
        }
    }, [ id, src, width])

    if ( ! id && ! src) {
        logger.error(new Error(`One of 'props.src' or 'props.id' is required!`))
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

export default FetchImage 
