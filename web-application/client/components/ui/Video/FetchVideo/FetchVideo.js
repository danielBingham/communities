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

import * as HeroIconsSolid from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import logger from '/logger'

import { loadFile, touchCache } from '/state/File'

import Spinner from '/components/Spinner'

import './FetchVideo.css'

const FetchVideo = function({ id, width, ref, onLoad, fallbackIcon }) {

    let icon = fallbackIcon || 'Photo'
    const Fallback = HeroIconsSolid[`${icon}Icon`]

    const [isLoading, setIsLoading] = useState(true)
    const [haveError, setHaveError] = useState(false)

    const needToLoad = useSelector((state) => { 

        // If the id is not already in the cache, then we need to load it.
        if ( ! (id in state.File.cache ) ) {
            return true
        }

        // If the id is in the cache, but the width isn't in the cache, then we
        // need to load. 
        if ( 
            id in state.File.cache 
                && width !== undefined && width !== null 
                && ! (width in state.File.cache[id]) 
        ) {
            return true
        } 
    
        // If the id is in the cache, but we don't have a width, then we're
        // using 'full' instead of the width.  If full isn't in the cache, then
        // we need to load it.
        else if ( 
            id in state.File.cache 
                && ( width === undefined || width === null )
                && ! ( 'full' in state.File.cache[id]) 
        ) {
            return true
        }
       
        // If the id and width we're using are in the cache, but the URL is set
        // to 'null', then we're already loading this video into the cache
        // (possibly in annother instance of this component).  We shouldn't
        // load it again.
        if ( 
            id in state.File.cache
                && width !== undefined && width !==  null
                && width in state.File.cache[id]
                && state.File.cache[id][width].url === null 
        ) {
            return false 
        } else if ( 
            id in state.File.cache
                && 'full' in state.File.cache[id]
                && state.File.cache[id]['full'].url === null 
        ) {
            return false
        }

        return false
    })
    
    // This will be null if the video is loading, false if it failed to load,
    // and a string with the full url to the video object blob if the video has
    // successfully lioaded.
    const videoUrl = useSelector((state) => {
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

        logger.error(`### FetchVideo :: Video(${id}, ${width}) failed to load: `, event)
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
            logger.error(`### FetchVideo :: Video(${id}, ${width}) failed to load: `, request)
        }
    }, [ request ])

    if ( ! id ) {
        logger.error(new Error(`'props.id' is required!`))
        return null
    }


    if ( haveError !== true && videoUrl !== null && videoUrl !== false) {
        return (
            <video
                ref={ref}
                onLoad={onLoadInternal} 
                onError={onErrorInternal}
                src={`${videoUrl}`} 
                controls
            />
        )
    } else if ( haveError === true || videoUrl === false ) {
        return (
            <div className="video__error"> <Fallback className='fetch-video__fallback' /></div>
        )

    } else if ( isLoading === true ) {
        return (
            <div className="video__loading">
                <Spinner /> 
            </div>
        )
    } else {
        return (
            <div className="video__error"> <Fallback className='fetch-video__fallback' /></div>
        )
    }
}

export default FetchVideo 
