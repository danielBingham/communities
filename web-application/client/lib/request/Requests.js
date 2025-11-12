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

export default class Requests {
    constructor(requests) {
        this.empty = []
        this.pending = []
        this.fulfilled = []
        this.failed = []

        this.requests = []

        if ( requests && Array.isArray(requests) ) {
            for(const request of requests) {
                this.addRequest(request)
            }
        }
    }

    addRequest(request) {
        if ( request === undefined || request === null ) {
            this.empty.push(request)
        } else if ( request?.state === 'pending' ) {
            this.pending.push(request)
        } else if ( request?.state === 'failed' ) {
            this.failed.push(request)
        } else if ( request?.state === 'fulfilled' ) {
            this.fulfilled.push(request)
        }
        this.requests.push(request)
    }

    hasEmpty() {
        return this.empty.length > 0
    }

    hasPending() {
        return this.pending.length > 0
    }

    hasFailed() {
        return this.failed.length > 0
    }

    hasFulfilled() {
        return this.fulfilled.length > 0
    }

    allFulfilled() {
        return this.fulfilled.length === this.requests.length
    }
}
