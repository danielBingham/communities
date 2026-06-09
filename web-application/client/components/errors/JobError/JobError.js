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

import Alert from '/components/ui/Alert'

import './JobError.css'

const JobError = function({ message, job, onContinue }) {

    // If we don't have a job, then no job error to report.
    if ( job === undefined || job === null ) {
        return null
    }

    // If this job has not failed, no error to report. 
    if ( ( job.failedReason === undefined || job.failedReason === null ) && job.progress?.step !== 'failed' ) {
        return null
    }

    // If we still have more attempts to make, then ignore the current error.
    if ( job.attemptsMade < job.opts?.attempts ) {
        return null
    }

    // Otherwise, we have an error to report.
    let alertMessage = `${message} failed.`
    if ( job.progress?.step === 'failed' && 'stepDescription' in job.progress ) {
        alertMessage = `${message} failed. ${job.progress.stepDescription}`
    } 

    return ( 
        <Alert type="error" timeout={5000} onClear={onContinue}>{ alertMessage }</Alert> 
    )
}

export default JobError
