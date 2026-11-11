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
 * The media the tests attach to posts: the files in assets/, and corrupted
 * copies of them.
 *
 *   image-1, image-2, image-3  .jpg photos
 *   png                        a .png, made from image-3
 *   video                      an .mp4, 31 seconds, 2160x3840
 *   mov                        a .mov, the first 4 seconds of the video
 *
 * The .png and .mov are scaled down copies, so that the tests that only need
 * the format don't wait on a large file. assets/README.md says how they were
 * made.
 *
 * Each is { key, name, path, kind, mimetype }: `kind` is the File kind the
 * API takes ('image' or 'video').
 ******************************************************************************/

const fs = require('node:fs')
const path = require('node:path')

const ASSETS_DIRECTORY = path.join(__dirname, 'assets')

const MEDIA = {
    'image-1': { name: 'image-asset-1.jpg', kind: 'image', mimetype: 'image/jpeg' },
    'image-2': { name: 'image-asset-2.jpg', kind: 'image', mimetype: 'image/jpeg' },
    'image-3': { name: 'image-asset-3.jpg', kind: 'image', mimetype: 'image/jpeg' },
    'png': { name: 'image-asset.png', kind: 'image', mimetype: 'image/png' },
    'video': { name: 'video-asset.mp4', kind: 'video', mimetype: 'video/mp4' },
    'mov': { name: 'video-asset.mov', kind: 'video', mimetype: 'video/quicktime' }
}

/**
 * The media file with this key.
 */
const getMedia = function(key) {
    if ( ! ( key in MEDIA ) ) {
        throw new Error(`There's no media '${key}'; see test/lib/fixtures/media.js.`)
    }
    return { key: key, ...MEDIA[key], path: path.join(ASSETS_DIRECTORY, MEDIA[key].name) }
}

/**
 * A corrupted copy of the media file with this key, in memory: its first 16
 * bytes, which say what kind of file it is, followed by 64 KB of zeros, which
 * no image or video decoder can make anything of. Named 'corrupted-<name>',
 * with the original's type, so it gets past the type checks to the
 * processing that has to catch it.
 *
 * @return {Object} { name, mimeType, buffer }, which Playwright's
 * setFiles() takes as a file.
 */
const getCorruptedMedia = function(key) {
    const media = getMedia(key)
    const header = Buffer.alloc(16)
    const file = fs.openSync(media.path, 'r')
    try {
        fs.readSync(file, header, 0, header.length, 0)
    } finally {
        fs.closeSync(file)
    }

    return {
        name: `corrupted-${media.name}`,
        mimeType: media.mimetype,
        buffer: Buffer.concat([ header, Buffer.alloc(64 * 1024) ])
    }
}

module.exports = {
    getMedia: getMedia,
    getCorruptedMedia: getCorruptedMedia
}
