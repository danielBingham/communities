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
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { getFileSource } from '/state/File'

export const useFileSource = function(fileId, width) {
    console.log(`== useFileSource(${fileId}, ${width})`)
    const url = useSelector((state) => {
        console.log(`== useFileSource(${fileId}, ${width})::`,
            `\ndictionary: `, state.File.dictionary,
            `\nsources: `, state.File.sources)
        // If we don't have a fileId, then we don't want to query a source.
        //
        // We don't have to worry about width, because if we don't have one
        // then getFileSource will just ignore it and query for the full file.
        if ( fileId === undefined || fileId === null ) {
            return null
        }

        // If the fileId isn't in sources already, then we need to query for
        // it.
        if ( ! (fileId in state.File.sources) ) {
            return undefined 
        }

        // If it's set to `null`, then the file doesn't exist.
        if ( state.File.sources[fileId] === null ) {
            return null
        }

        // If the width doesn't exist in sources, then we need to query for it.
        if ( width !== null && width !== undefined && ! ( width in state.File.sources[fileId] ) ) {
            return undefined

        }

        // If we have a width...
        if ( width !== null && width !== undefined ) {

            // If the width is null, then we queried for it and didn't find it.
            // Attempt to return full.
            if ( state.File.sources[fileId][width] === null ) {
                if ( 'full' in state.File.sources[fileId] ) {
                    return state.File.sources[fileId]['full']
                } else {
                    return null
                }
            }

            // Otherwise, return the width link.
            return state.File.sources[fileId][width]
        }

        // Finally, attempt to return full.
        if ( 'full' in state.File.sources[fileId] ) {
            return state.File.sources[fileId]['full']
        } else {
            return null
        }
    })

    const [request, makeRequest, resetRequest ] = useRequest()

    const refresh = function() {
        makeRequest(getFileSource(fileId, width))
    }

    useEffect(() => {
        if ( fileId !== null && fileId !== undefined && url === undefined && request?.state !== 'pending') {
            // If the failure is unknown or frontend-error, then we're in potential loop territory.  
            if ( request?.state === 'failed' 
                && (request.error.type === 'unknown' || request.error.type === 'frontend-error' ) )
            {
                logger.error(new Error(`Aborting request due to error.`))
                return
            }
            console.log(`== useFileSource(${fileId},${width}):: querying`)
            makeRequest(getFileSource(fileId, width))
        }
    }, [ fileId, width, url, request ])

    return [url, request, refresh]
}
