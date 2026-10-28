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

const { fetchEndpoint } = require('./fetchEndpoint')

async function addReaction(session, postId, reaction) {
    const response = await fetchEndpoint('POST', `/post/${encodeURIComponent(postId)}/reactions`, { session: session, body: { reaction: reaction } })
    if ( ! response.ok ) {
        throw new Error(`Failed to react to Post(${postId}): ${response.status} ${JSON.stringify(response.content)}`)
    }
    return response.content.entity
}

module.exports = {
    addReaction: addReaction
}
