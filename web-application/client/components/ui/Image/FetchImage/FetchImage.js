import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

import { loadFile } from '/state/File'

import Spinner from '/components/Spinner'

const FetchImage = function({ id, width, ref, onLoad }) {
    const [isLoading, setIsLoading] = useState(true)

    const needToLoad = useSelector((state) => { 
        if ( ! (id in state.File.cache ) ) {
            return true
        }

        if ( id in state.File.cache && width && ! (width in state.File.cache[id]) ) {
            return true
        }
        
        if ( id in state.File.cache
            && width in state.File.cache[id]
            && state.File.cache[id][width] === null ) {
            return true
        }

        return false
    })
            
    const imageUrl = useSelector((state) => {
        if ( id in state.File.cache ) {
            if ( width && width in state.File.cache[id] ) {
                return state.File.cache[id][width]
            } else if ( 'full' in state.File.cache[id] ) {
                return state.File.cache[id]['full']
            }
        }

        return null
    })

    const dispatch = useDispatch()

    const onLoadInternal = function(event) {
        setIsLoading(false)  

        if ( onLoad ) {
            onLoad(event)
        }
    }

    const onErrorInternal = function(event) {
        setIsLoading(false)

        logger.error(`### FetchImage :: Image(${id}, ${width}) failed to load: `, event)
    }

    useEffect(function() {
        if ( ! id ) {
            logger.error(new Error(`'props.id' is required!`))
            return 
        }

        if ( imageUrl === null || needToLoad ) {
            dispatch(loadFile(id, width))
        } 
    }, [ id, width, needToLoad])

    if ( ! id ) {
        logger.error(new Error(`'props.id' is required!`))
        return null
    }

    return (
        <>
            { imageUrl !== null && <img 
                ref={ref}
                onLoad={onLoadInternal} 
                onError={onErrorInternal}
                src={`${imageUrl}`} 
            /> }
            { isLoading && <div className="image__loading">
                <Spinner /> 
            </div> }
        </>
    ) 
}

export default FetchImage 
