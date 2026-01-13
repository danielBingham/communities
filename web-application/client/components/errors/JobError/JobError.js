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

import ErrorModal from '/components/errors/ErrorModal'

import './JobError.css'

const State = {
    UnknownFailure: 'unknown-failure'
}

const JobError = function({ message, job, onContinue }) {

    if ( job !== undefined && job !== null ) {
        if ( ( job.failedReason !== undefined && job.failedReason !== null ) || job.progress.step === 'failed' ) {

            let state = State.UnknownFailure
            if ( job.failedReason !== undefined && job.failedReason !== null ) {
                state = State.UnknownFailure 
            }

            console.log(job)
            return (
                <ErrorModal onContinue={onContinue}>
                    { state === State.UnknownFailure && <p>{ message } failed.</p> }
                    { 'progress' in job && 'stepDescription' in job?.progress && <p>{ job.progress.stepDescription }</p> }
                </ErrorModal>
            )
        }
    }

    return null
}

export default JobError
