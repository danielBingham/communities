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
import * as Icons from '@heroicons/react/24/solid'

import logger from '/logger'

import { useFile, useFileSource } from '/lib/hooks/File'

import Image from '/components/ui/Image'
import Video from '/components/ui/Video'

import Spinner from '/components/Spinner'


const File = function({ id, width, type, fallback, className, onLoad, onError, ref }) {
    const [file, fileRequest] = useFile(id)
    const [url, sourceRequest] = useFileSource(id, width)

    console.log(`## File(${id}, ${width}):: `,
        `\nFile: `, file, 
        `\nUrl: `, url)
    if ( file === undefined || url === undefined) {
        return ( <Spinner /> )
    }

    if ( file === null || url === null ) {
        if ( fallback !== undefined || fallback !== null ) {
            if ( `${fallback}Icon` in Icons ) {
                const FallbackIcon = Icons[`${fallback}Icon`]
                return (<FallbackIcon className={`file ${ className ? className : ''}`} />)
            }
        }

        return null
    }

    const filetype = file.type.split('/')[0]
    if ( type !== undefined && type !== null && type !== filetype ) {
        logger.error(`## File(${id}, ${width}):: Specified type, '${type}', does not match File type, '${filetype}'.`)
        return null
    }

    if ( filetype === 'video' ) {
        return ( <Video className={`file ${className ? className : ''}`} src={url} onLoad={onLoad} onError={onError} ref={ref} />)
    }

    return ( <Image className={`file ${className ? className : ''}`} src={url} onLoad={onLoad} onError={onError} ref={ref} /> )
}

export default File
