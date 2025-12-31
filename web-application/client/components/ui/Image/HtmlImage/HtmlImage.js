import { useState } from 'react'
import { useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

const HtmlImage = function({ id, src, width, ref, onLoad }) {
    const [isLoading, setIsLoading] = useState(true)
    const api = useSelector((state) => state.system.api)

    const onLoadInternal = function(event) {
        setIsLoading(false)  

        if ( onLoad ) {
            onLoad(event)
        }
    }

    if ( ! id && ! src) {
        console.error(new Error(`One of 'props.src' or 'props.id' is required!`))
        return null
    }

    let url = ''
    if ( src !== undefined && src !== null ) {
        url = src
    } else if ( id !== undefined && id !== null ) {
        url = `${api}/file/${id}/source`
    }

    const style = isLoading ? { position: 'absolute', top: '-10000px', left: '-10000px' } : {}
    const widthSelector = width ? `?width=${width}` : ''
    return (
        <div>
            <img 
                ref={ref}
                onLoad={onLoadInternal} 
                style={style}
                src={`${url}${widthSelector}`} 
            />
            { isLoading && <div className="image__loading">
                <Spinner /> 
            </div> }
        </div>
    )
}

export default HtmlImage 
