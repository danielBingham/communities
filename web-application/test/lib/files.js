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


/******************************************************************************
 * Uploading media through the API, for posts that start a test with images
 * or a video. Posts made with them: createPost(session, userId, { files: [
 * file.id ] }) in posts.js.
 *
 * An upload is three steps, as the client does it: create the File (POST
 * /files), upload its content (POST /upload/:id/image or /video), and wait
 * for the worker to process it (resize the image, or transcode the video),
 * when its state is 'ready'.
 ******************************************************************************/

const fs = require('node:fs')
const crypto = require('node:crypto')

const { fetchEndpoint } = require('./fetchEndpoint')
const { getMedia } = require('./fixtures/media')

/**
 * Upload the media file with this key (see fixtures/media.js) as the user,
 * wait for it to be processed, and return the File.
 *
 * @param {Object} session  The user's session, from loginAs().
 * @param {string} userId   The user's id.
 * @param {string} key      The media's key: 'image-1', 'video', ...
 * @param {Object} options
 * @param {number} options.timeout  Milliseconds to wait for processing.
 * Videos take a while: 3 minutes by default.
 */
const uploadMedia = async function(session, userId, key, { timeout = 180000 } = {}) {
    const media = getMedia(key)
    const id = crypto.randomUUID()

    const created = await fetchEndpoint('POST', '/files', {
        session: session,
        body: [ {
            id: id,
            userId: userId,
            type: media.mimetype,
            kind: media.kind,
            mimetype: media.mimetype,
            state: 'pending'
        } ]
    })
    if ( ! created.ok ) {
        throw new Error(`Failed to create File for '${media.name}': ${created.status} ${JSON.stringify(created.content)}`)
    }

    const form = new FormData()
    form.append('file', await fs.openAsBlob(media.path, { type: media.mimetype }), media.name)
    const uploaded = await fetchEndpoint('POST', `/upload/${encodeURIComponent(id)}/${media.kind}`, {
        session: session,
        form: form
    })
    if ( ! uploaded.ok ) {
        throw new Error(`Failed to upload '${media.name}': ${uploaded.status} ${JSON.stringify(uploaded.content)}`)
    }

    const deadline = Date.now() + timeout
    while ( true ) {
        const response = await fetchEndpoint('GET', `/file/${encodeURIComponent(id)}`, { session: session })
        if ( ! response.ok ) {
            throw new Error(`Failed to get File(${id}) for '${media.name}': ${response.status} ${JSON.stringify(response.content)}`)
        }

        const file = response.content.entity
        if ( file.state === 'ready' ) {
            return file
        } else if ( file.state === 'error' ) {
            throw new Error(`'${media.name}' failed to process.`)
        } else if ( Date.now() > deadline ) {
            throw new Error(`'${media.name}' wasn't processed within ${timeout} ms: it's still '${file.state}'.`)
        }

        await new Promise((resolve) => setTimeout(resolve, 250))
    }
}

module.exports = {
    uploadMedia: uploadMedia
}
