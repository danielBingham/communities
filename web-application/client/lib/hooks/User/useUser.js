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

import { getUser } from '/state/User'

export const useUser = function(id, options) {
    const user = useSelector((state) => {
        if ( ! id ) {
            return null
        }
        if ( ! ( id in state.User.dictionary ) ) {
            return undefined
        }
        return state.User.dictionary[id] 
    })

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( id && user === undefined && request?.state !== 'pending' 
            && options?.noQuery !== true && options?.skip !== true
        ) {
            makeRequest(getUser(id))
        }
    }, [ id, user, request])

    return [user, request]
}
