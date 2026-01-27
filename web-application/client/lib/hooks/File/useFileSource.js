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

const hasVariant = function(file, variant) {
    if ( variant === undefined || variant === null ) {
        return true
    }

    // Files always have the root variant.
    if ( variant === 'full' ) {
        return true
    }

    if ( file.variants === null ) {
        return true
    }

    if ( Array.isArray(file.variants) ) {
        const v = file.variants.find((v) => v == variant)
        if ( v === undefined ) {
            return false
        } else {
            return v == variant
        }
    }
}

export const useFileSource = function(fileId, variant) {

    const file = useSelector((state) => fileId && fileId in state.File.dictionary ? state.File.dictionary[fileId] : null)
    const url = useSelector((state) => {
        // If we don't have a fileId, then we don't want to query a source.
        if ( fileId === undefined || fileId === null || file === null ) {
            return null
        }

        // If we don't have a variant, then don't query.
        if ( variant === undefined || variant === null ) {
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

        // If the file doesn't have that variant, then we don't want to query
        // for it.
        if ( ! hasVariant(file, variant) ) {
            return null
        }

        // If the variant doesn't exist in sources, then we need to query for it.
        if ( ! ( variant in state.File.sources[fileId] ) ) {
            return undefined
        }

        // Otherwise, return the variant link.
        return state.File.sources[fileId][variant]
    })  

    const [request, makeRequest, resetRequest ] = useRequest()

    const refresh = function() {
        makeRequest(getFileSource(fileId, variant))
    }  

    useEffect(() => {
        if ( fileId !== null && fileId !== undefined && url === undefined 
            && (request?.state !== 'pending' && request?.state !== 'failed')  
        ) {
            makeRequest(getFileSource(fileId, variant))
        }
    }, [ fileId, variant, url, request ])

    return [url, request, refresh]
}
