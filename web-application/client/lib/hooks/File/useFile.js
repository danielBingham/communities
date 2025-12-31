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

import { useRequest } from '/lib/hooks/useRequest'

import { getFile } from '/state/File'

export const useFile = function(fileId) {
    const file = useSelector((state) => fileId && fileId in state.File.dictionary ? state.File.dictionary[fileId] : null)

    const [request, makeRequest, resetRequest ] = useRequest()

    const refresh = function() {
        makeRequest(getFile(fileId))
    }

    useEffect(() => {
        if ( fileId && file === null && request === null ) {
            makeRequest(getFile(fileId))
        }
    }, [ fileId, file, request ])

    return [file, request, refresh]
}
