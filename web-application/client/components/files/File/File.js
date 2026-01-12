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
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import { useFile, useFileSource } from '/lib/hooks/File'

import Image from '/components/ui/Image'
import Video from '/components/ui/Video'

import Spinner from '/components/Spinner'

import './File.css'

const File = function({ id, width, type, fallback, className, onLoad, onError, ref }) {
    const [file, fileRequest] = useFile(id, width)
    const [thumbnail, thumbnailRequest] = useFile( file?.kind === 'video' && file?.thumbId ? file.thumbId : undefined, width)

    // TECHDEBT HACK: Need to reference the id through the file to ensure that we retrieve the
    // file first and only retrieve the source URL if we actually successfully
    // retreive the file.
    // 
    // We should probably handle this better in useFileSource.  Right now
    // there's a case, where you can generate an error by calling useFileSource
    // without first calling the file.
    const [url, sourceRequest, refreshFileSource] = useFileSource(file?.id, width)
    const [ thumbnailUrl, thumnailUrlRequest] = useFileSource(thumbnail?.id, width)

    // If we fail to load the requested variant URL, then fall back on the full URL.
    const [rootUrl, rootRequest, refreshRoot] = useFileSource(url === null ? file?.id : null, 'full')
    const [rootThumbnailUrl, rootThumbnailUrlRequest] = useFileSource(thumbnailUrl === null ? thumbnail?.id : null, 'full')

    const onErrorInternal = function(event) {
        logger.error(`Failed to load file with errror: `, event.target.error) 
        if ( 'error' in event.target && event.target.error.code === 2 ) {
            refreshFileSource()
        }

        if ( onError !== undefined && onError !== null ) {
            onError(event)
        }
    }

    // ========================================================================
    //      RENDER
    // ========================================================================

    if ( file === undefined 
        || ( url === undefined 
            || (url === null && rootUrl === undefined)
        )
    ) {
        return ( <Spinner /> )
    }

    if ( file?.kind === 'video' && 
        ( thumbnail === undefined || thumbnailUrl === undefined || (thumbnailUrl === null && rootThumbnailUrl === undefined))
    ) {
        return ( <Spinner /> )
    }

    if ( file === null ||  ( url === null && rootUrl === null ) ) {
        if ( fallback === true ) {
            return (
                <div className="file__fallback">
                    <div className="file__fallback__icon"> { type && type === 'video' ? <VideoCameraIcon /> : <PhotoIcon /> }</div>
                    <p>Failed to load { type && type === 'video' ? 'video' : 'image' }.  If the error persists while you have a good connection, please report as a bug!</p>
                </div>
            )
        }

        return null
    }

    const filetype = file.type.split('/')[0]
    if ( type !== undefined && type !== null && type !== filetype ) {
        logger.error(`## File(${id}, ${width}):: Specified type, '${type}', does not match File type, '${filetype}'.`)
        return null
    }

    let thumb = thumbnailUrl
    if ( thumb === null || thumb === undefined ) {
        thumb = rootThumbnailUrl
    }

    if ( url !== null ) {
        if ( filetype === 'video' ) {
            return ( <Video className={`file ${className ? className : ''}`} src={url} poster={thumb}  onLoad={onLoad} onError={onErrorInternal} ref={ref} />)
        }

        return ( <Image className={`file ${className ? className : ''}`} src={url} onLoad={onLoad} onError={onErrorInternal} ref={ref} /> )
    } else if ( url === null && rootUrl !== null ) {
        if ( filetype === 'video' ) {
            return ( <Video className={`file ${className ? className : ''}`} src={rootUrl} poster={thumb} onLoad={onLoad} onError={onErrorInternal} ref={ref} />)
        }

        return ( <Image className={`file ${className ? className : ''}`} src={rootUrl} onLoad={onLoad} onError={onErrorInternal} ref={ref} /> )
    }
}

export default File
