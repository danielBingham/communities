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

import { getJob } from '/state/jobs'

export const useJob = function(queue, jobId) {
    const job = useSelector((state) => {
        if ( jobId === undefined || jobId === null ) {
            return null
        }

        if ( ! ( queue in state.jobs.dictionary ) ) {
            return null
        }

        if ( ! ( jobId in state.jobs.dictionary[queue] ) ) {
            return undefined
        }

        return state.jobs.dictionary[queue][jobId]
    })

    const [request, makeRequest, resetRequest ] = useRequest()

    const refresh = function() {
        makeRequest(getJob(queue, jobId))
    }

    useEffect(() => {
        if ( queue !== undefined && queue !== null && jobId !== undefined && jobId !== null && job === undefined 
            && ( request?.state !== 'pending' && request?.state !== 'failed' )) 
        {
            makeRequest(getJob(queue, jobId))
        }
    }, [ jobId, job, request ])

    return [job, request, refresh]
}
