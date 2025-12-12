import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import * as HeroIconsSolid from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import logger from '/logger'

import { loadFile, touchCache } from '/state/File'

import Spinner from '/components/Spinner'

import './FetchImage.css'

const FetchImage = function({ id, width, ref, onLoad, fallbackIcon }) {

    let icon = fallbackIcon || 'Photo'
    const Fallback = HeroIconsSolid[`${icon}Icon`]

    const [isLoading, setIsLoading] = useState(true)
    const [haveError, setHaveError] = useState(false)


    const needToLoad = useSelector((state) => { 
        if ( ! (id in state.File.cache ) ) {
            return true
        }

        if ( id in state.File.cache && width && ! (width in state.File.cache[id]) ) {
            return true
        }
        
        if ( id in state.File.cache
            && width in state.File.cache[id]
            && state.File.cache[id][width].url === null ) {
            return false 
        }

        return false
    })
    
    // This will be null if the image is loading, false if it failed to load,
    // and a string with the full url to the image object blob if the image has
    // successfully lioaded.
    const imageUrl = useSelector((state) => {
        if ( id in state.File.cache ) {
            if ( width && width in state.File.cache[id] ) {
                return state.File.cache[id][width].url
            } else if ( 'full' in state.File.cache[id] ) {
                return state.File.cache[id]['full'].url
            }
        }

        return null
    })

    const [ request, makeRequest ] = useRequest()

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

        if ( needToLoad ) {
            makeRequest(loadFile(id, width))
        }  else {
            dispatch(touchCache({ fileId: id }))
        }
    }, [ id, width, needToLoad])

    useEffect(function() {
        if ( request?.state === 'failed' ) {
            setIsLoading(false)
            setHaveError(true)
            logger.error(`### FetchImage :: Image(${id}, ${width}) failed to load: `, request)
        }
    }, [ request ])

    if ( ! id ) {
        logger.error(new Error(`'props.id' is required!`))
        return null
    }


    if ( haveError !== true && imageUrl !== null && imageUrl !== false) {
        return (
            <img 
                ref={ref}
                onLoad={onLoadInternal} 
                onError={onErrorInternal}
                src={`${imageUrl}`} 
            />
        )
    } else if ( haveError === true || imageUrl === false ) {
        return (
            <div className="image__error"> <Fallback className='fetch-image__fallback' /></div>
        )

    } else if ( isLoading === true ) {
        return (
            <div className="image__loading">
                <Spinner /> 
            </div>
        )
    } else {
        return (
            <div className="image__error"> <Fallback className='fetch-image__fallback' /></div>
        )
    }
}

export default FetchImage 
