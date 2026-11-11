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
 * Images, videos and link previews in the browser: attaching them in the post
 * form, and finding them in posts.
 *
 * The get...() functions return a Locator (or, where they say so, a value
 * read from the page) and do nothing to the page; the rest are actions.
 *
 * The media are the files in test/lib/fixtures/assets, from getMedia(key)
 * in test/lib/fixtures/media.js. The links are the News posts in
 * test/lib/linkPreviews.js. To set up a post with media or a link through
 * the API, see test/lib/files.js and test/lib/linkPreviews.js.
 ******************************************************************************/

const config = require('./config')
const { eventually } = require('./wait')

// ============================================================================
// Attaching media in the post form
// ============================================================================

/**
 * Get the post form's "Add Image" button. The form doesn't offer it while
 * the post has a link preview or shares a post.
 */
const getAddImageButton = function(page) {
    return page.getByRole('button', { name: 'Add Image', exact: true })
}

/**
 * Get the post form's "Add Video" button. Like "Add Image", it isn't offered
 * while the post has a link preview or shares a post.
 */
const getAddVideoButton = function(page) {
    return page.getByRole('button', { name: 'Add Video', exact: true })
}

/**
 * Get every file attached to the post form, in the order the post will show
 * them, however far each is through uploading and processing.
 *
 * Found by class: until a file is processed, its attachment is named by
 * whatever it's showing ('Processing...'), and once it is, by the file's
 * name, which it forgets when the page is reloaded.
 */
const getDraftFiles = function(page) {
    return page.locator('.post-form .post-file-attachment')
}

/**
 * Get the file named `name` attached to the post form, once it's been
 * processed: 'Draft file image-asset-1.jpg'.
 */
const getDraftFile = function(page, name) {
    return page.getByRole('button', { name: `Draft file ${name}`, exact: true })
}

/**
 * Get the ids of the files attached to the post form, in order: the ids of
 * the Files the post will have. A value, read from the page.
 */
const getDraftFileIds = async function(page) {
    return await getDraftFiles(page).evaluateAll((attachments) => attachments.map((attachment) => attachment.id))
}

/**
 * Get the image or video in `scope`, an attached file in the post form (from
 * getDraftFile() or getDraftFiles()). The poster that covers a video until
 * it plays isn't one. For a post's, which has its author's picture too, use
 * getShownMedia().
 */
const getMediaIn = function(scope) {
    return scope.getByRole('img').or(scope.locator('video'))
}

/**
 * Get the size of an image's or a video's content, as the browser decoded
 * it, rather than as it's shown: { width, height }, 0 by 0 if it didn't
 * load. A value, read from the page.
 *
 * Processing scales images and videos down to 650 pixels wide for posts, so
 * what a post shows is 650 wide however big the file uploaded was.
 */
const getMediaSize = async function(media) {
    return await media.evaluate((element) => element.tagName === 'VIDEO'
        ? { width: element.videoWidth, height: element.videoHeight }
        : { width: element.naturalWidth, height: element.naturalHeight })
}

/**
 * Get the button that removes `draftFile` from the post form.
 */
const getRemoveFileButton = function(draftFile) {
    return draftFile.getByRole('button', { name: 'Remove file' })
}

/**
 * Choose files with an "Add Image" or "Add Video" button (`button`), the way
 * a user picks them in the file chooser it opens. Waits for nothing after,
 * since a file might be refused, or fail to process: attachMedia() waits for
 * them to be shown.
 *
 * @param {Locator} button  getAddImageButton(page) or getAddVideoButton(page).
 * @param {Array} files     Paths (getMedia(key).path), or files made in
 * memory ({ name, mimeType, buffer }, like getCorruptedMedia(key)).
 */
const chooseFiles = async function(page, button, files) {
    const [ chooser ] = await Promise.all([ page.waitForEvent('filechooser'), button.click() ])
    await chooser.setFiles(files)
}

/**
 * Wait for the file named `name`, attached to the post form, to be uploaded,
 * processed and shown, which can take minutes for a video. Once its image
 * or video has loaded, it shows the button to remove it.
 *
 * If uploading or processing a file fails instead, the form says so, and
 * this throws with what it said, rather than waiting out the timeout. A
 * failed upload names the file; failed processing doesn't, so that fails
 * the wait for every file attached with it.
 */
const waitForDraftFile = async function(page, name) {
    const shown = getRemoveFileButton(getDraftFile(page, name))
    const failed = page.getByRole('alert').filter({ hasText: `'${name}' failed to upload.` })
        .or(page.getByRole('alert').filter({ hasText: 'failed to process.' }))

    await shown.or(failed).first().waitFor({ timeout: config.MEDIA_TIMEOUT })
    if ( ! await shown.isVisible() ) {
        throw new Error(`Attaching ${name} failed. The post form says: "${await failed.first().innerText()}"`)
    }
}

/**
 * Attach media to the post form, and wait for them to be uploaded,
 * processed and shown.
 *
 * @param {Array} media     From getMedia(key): any number of images, or one
 * video.
 */
const attachMedia = async function(page, media) {
    const button = media[0].kind === 'video' ? getAddVideoButton(page) : getAddImageButton(page)
    await chooseFiles(page, button, media.map((file) => file.path))

    // Wait for them all at once: the form only shows that a file failed for
    // 5 seconds, so waiting for each in turn could miss it.
    const results = await Promise.allSettled(media.map((file) => waitForDraftFile(page, file.name)))
    const failure = results.find((result) => result.status === 'rejected')
    if ( failure ) {
        throw failure.reason
    }
}

/**
 * Remove `draftFile` from the post form, and wait for it to go.
 */
const removeDraftFile = async function(draftFile) {
    await getRemoveFileButton(draftFile).click()
    await draftFile.waitFor({ state: 'detached' })
}

/**
 * Drag the file attached at position `from` (0 for the first) in the post
 * form to position `to`, with the mouse, and wait for the form to reorder
 * them. Both have to be in the window: the attachments are large, so a test
 * that moves one past others makes the window tall enough to hold them.
 *
 * The drag and drop library moves the attachments on the page itself as
 * they're dragged, so the order on the page can be right while the order
 * the post will be saved with isn't. Check the post's order after posting.
 */
const moveDraftFile = async function(page, from, to) {
    const files = getDraftFiles(page)
    const before = await getDraftFileIds(page)

    const source = await files.nth(from).boundingBox()
    const target = await files.nth(to).boundingBox()

    // Pick it up, nudge it so the drag starts, and drop it over the target,
    // past its middle in the direction it's moving.
    const x = source.x + source.width / 2
    await page.mouse.move(x, source.y + source.height / 2)
    await page.mouse.down()
    await page.mouse.move(x, source.y + source.height / 2 + (to > from ? 10 : -10), { steps: 5 })
    const y = target.y + target.height * (to > from ? 0.75 : 0.25)
    await page.mouse.move(target.x + target.width / 2, y, { steps: 25 })
    await page.mouse.up()

    const expected = [ ...before ]
    expected.splice(to, 0, ...expected.splice(from, 1))
    await eventually(async () => {
        const after = await getDraftFileIds(page)
        if ( JSON.stringify(after) !== JSON.stringify(expected) ) {
            throw new Error(`Moving the attachment at ${from} to ${to} left them in this order: ${after}`)
        }
    })
}

// ============================================================================
// Media in posts
// ============================================================================

/**
 * Get the gallery of a post with more than one image or video. A post with
 * only one shows it without a gallery around it.
 */
const getGallery = function(post) {
    return post.getByRole('group', { name: 'Post media gallery' })
}

/**
 * Get where a post's gallery is: '2 / 3' while it's showing the second of
 * three.
 */
const getGalleryPosition = function(post) {
    return getGallery(post).getByText(/^\d+ \/ \d+$/)
}

const getNextItemButton = function(post) {
    return getGallery(post).getByRole('button', { name: 'Next item' })
}

const getPreviousItemButton = function(post) {
    return getGallery(post).getByRole('button', { name: 'Previous item' })
}

/**
 * Get the image or video `post` is showing: its only one, or the one its
 * gallery is on. Not the shared post's, nor the gallery's hidden copies of
 * the ones either side, which it loads ahead.
 *
 * Found by class: the gallery's hidden copies are the same images.
 */
const getShownMedia = function(post) {
    // An image's .file is the <img>; a video's is around the <video>.
    const shown = post.locator(':scope > .post-gallery > .file:not(.post-gallery__preload)')
    return shown.and(post.getByRole('img')).or(shown.locator('video'))
}

/**
 * Wait for an image or a video (from getShownMedia(), or getMediaIn() in the
 * post form) to load: an image's content, or a video's size and length.
 * A post's media load after the post does: the browser asks the API for a
 * link to each file, and then loads it from where files are stored, which
 * on S3 takes a moment. Wait for this before checking which file is shown
 * (getFileId()) or its size (getMediaSize()).
 */
const waitForMedia = async function(media) {
    await media.waitFor({ state: 'attached' })
    await eventually(async () => {
        const loaded = await media.evaluate((element) => element.tagName === 'VIDEO'
            ? element.readyState >= HTMLMediaElement.HAVE_METADATA && element.videoWidth > 0
            : element.complete && element.naturalWidth > 0)
        if ( ! loaded ) {
            throw new Error(`The post's image or video hasn't loaded.`)
        }
    })
}

/**
 * Get the id of the File `media` shows: images and videos are served from
 * links with the File's id in them, '.../files/<id>.650.jpeg'. A value, read
 * from the page.
 */
const getFileId = async function(media) {
    const source = await media.evaluate((element) => element.currentSrc || element.src)
    const match = /\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})[./]/.exec(source)
    if ( match === null ) {
        throw new Error(`Couldn't find a File's id in '${source}'.`)
    }
    return match[1]
}

// ============================================================================
// Videos
// ============================================================================

/**
 * Get the button covering a video until it's played.
 */
const getPlayVideoButton = function(scope) {
    return scope.getByRole('button', { name: 'Play video' })
}

/**
 * Get how far `video` has played: { currentTime, paused, ended, error }, the
 * error being the MediaError's code if it couldn't play. A value, read from
 * the page.
 */
const getPlayback = async function(video) {
    return await video.evaluate((element) => ({
        currentTime: element.currentTime,
        paused: element.paused,
        ended: element.ended,
        error: element.error === null ? null : element.error.code
    }))
}

/**
 * Play the video in `scope` (a post, or an attached file), and wait for it
 * to start.
 */
const playVideo = async function(scope) {
    const video = scope.locator('video')
    await getPlayVideoButton(scope).click()
    await eventually(async () => {
        const playback = await getPlayback(video)
        if ( playback.paused || playback.currentTime <= 0 ) {
            throw new Error(`The video hasn't started playing: ${JSON.stringify(playback)}`)
        }
    })
}

// ============================================================================
// Link previews
// ============================================================================

/**
 * Get the link previews in `scope`: the post form, or a post (and any post
 * it shares). A preview is a link to the page, with its title as a heading.
 */
const getLinkPreview = function(scope) {
    const page = typeof scope.page === 'function' ? scope.page() : scope
    return scope.getByRole('link').filter({ has: page.getByRole('heading', { level: 2 }) })
}

/**
 * Get the title of the page `preview` links to.
 */
const getLinkPreviewTitle = function(preview) {
    return preview.getByRole('heading', { level: 2 })
}

/**
 * Get the name of the site `preview` links to. Found by class: it's plain
 * text above the title.
 */
const getLinkPreviewSite = function(preview) {
    return preview.locator('.link-preview__site')
}

/**
 * Get the "X" that removes the link preview from the post form. It has no
 * accessible name to find it by, so it's found by its class.
 */
const getRemoveLinkPreviewButton = function(page) {
    return page.locator('.post-form a.remove')
}

/**
 * Wait for the post form to show a link preview: the server makes one for
 * the first link in the post's text, which it fetches to do.
 */
const waitForLinkPreview = async function(page) {
    await getLinkPreview(page.locator('.post-form')).waitFor()
}

/**
 * Remove the link preview from the post form, and wait for it to go.
 */
const removeLinkPreview = async function(page) {
    await getRemoveLinkPreviewButton(page).click()
    await getLinkPreview(page.locator('.post-form')).waitFor({ state: 'detached' })
}

module.exports = {
    getAddImageButton: getAddImageButton,
    getAddVideoButton: getAddVideoButton,
    getDraftFiles: getDraftFiles,
    getDraftFile: getDraftFile,
    getDraftFileIds: getDraftFileIds,
    getMediaIn: getMediaIn,
    getMediaSize: getMediaSize,
    getRemoveFileButton: getRemoveFileButton,
    chooseFiles: chooseFiles,
    waitForDraftFile: waitForDraftFile,
    attachMedia: attachMedia,
    removeDraftFile: removeDraftFile,
    moveDraftFile: moveDraftFile,

    getGallery: getGallery,
    getGalleryPosition: getGalleryPosition,
    getNextItemButton: getNextItemButton,
    getPreviousItemButton: getPreviousItemButton,
    getShownMedia: getShownMedia,
    waitForMedia: waitForMedia,
    getFileId: getFileId,

    getPlayVideoButton: getPlayVideoButton,
    getPlayback: getPlayback,
    playVideo: playVideo,

    getLinkPreview: getLinkPreview,
    getLinkPreviewTitle: getLinkPreviewTitle,
    getLinkPreviewSite: getLinkPreviewSite,
    getRemoveLinkPreviewButton: getRemoveLinkPreviewButton,
    waitForLinkPreview: waitForLinkPreview,
    removeLinkPreview: removeLinkPreview
}
