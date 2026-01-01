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
const path = require('node:path')

const mime = require('mime')
const { v4: uuidv4 } = require('uuid')

const { ImageService, VideoService, S3FileService, FileDAO }= require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class FileController {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.videoService = new VideoService(core)
        this.imageService = new ImageService(core)
        this.fileService = new S3FileService(core)
        this.fileDAO = new FileDAO(core)
    }

    /**
     * POST /upload/image
     *
     * Allows the user to upload an image, which can then be used by other
     * entities.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.file The file information, defined by multer.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async uploadImage(request, response) {
        const logger = request.logger ? request.logger : this.core.logger

        const currentPath = request.file.path

        logger.info(`Processing image upload: ${currentPath}`)

        const currentUser = request.session.user 

        if ( ! currentUser ) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to upload a file.`)
        }

        /**********************************************************************
         * Validation
         **********************************************************************/

        const mimetype = request.file.mimetype 
        if ( ! ImageService.SUPPORTED_MIMETYPES.includes(mimetype) ) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid file of type ${mimetype}.`,
                `Unsupported file type.  Supported types are: ${ImageService.SUPPORTED_TYPES.join(',')}`)
        }

        const fileExtension = path.extname(request.file.originalname).toLowerCase()
        if ( ! ImageService.SUPPORTED_EXTENSIONS.includes(fileExtension) ) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid file of type ${mimetype}.`,
                `Unsupported file extension.  Supported extensions are: ${ImageService.SUPPORTED_EXTENSIONS.join(',')}`)
        }

        /**********************************************************************
         * Permissions and Validation checks complete.
         *      Upload the file.
         **********************************************************************/

        const id = uuidv4()
        const filepath = `files/${id}.${mime.getExtension(mimetype)}`

        await this.fileService.uploadFile(currentPath, filepath)

        const file = {
            id: id,
            userId: request.session.user.id,
            type: mimetype,
            location: this.config.s3.bucket_url,
            filepath: filepath
        }

        await this.fileDAO.insertFile(file)

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ id ])
        if ( files.length <= 0) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(500, 'insertion-failure', `Failed to select newly inserted file ${id}.`)
        }

        this.fileService.removeLocalFile(currentPath)

        await this.core.queue.add('resize-image', { session: { user: currentUser }, file: file })

        response.status(200).json({
            entity: files[0],
            relations: {}
        })
    }

    /**
     * POST /upload/video
     *
     * Allows the user to upload a video, which can then be used by other
     * entities.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.file The file information, defined by multer.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async uploadVideo(request, response) {
        const logger = request.logger ? request.logger : this.core.logger

        const currentPath = request.file.path

        logger.info(`Processing video upload: ${currentPath}`)

        const currentUser = request.session.user 

        if ( ! currentUser ) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to upload a file.`)
        }

        /**********************************************************************
         * Validation
         **********************************************************************/

        const mimetype = request.file.mimetype 
        if ( ! VideoService.SUPPORTED_MIMETYPES.includes(mimetype) ) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid video file of type ${mimetype}.`,
                `Unsupported video type.  Supported types are: ${VideoService.SUPPORTED_TYPES.join(',')}`)
        }

        const fileExtension = path.extname(request.file.originalname).toLowerCase()
        if ( ! VideoService.SUPPORTED_EXTENSIONS.includes(fileExtension) ) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid video file of type ${mimetype}.`,
                `Unsupported video extension.  Supported extensions are: ${VideoService.SUPPORTED_EXTENSIONS.join(',')}`)
        }

        /**********************************************************************
         * Permissions and Validation checks complete.
         *      Upload the file.
         **********************************************************************/

        const id = uuidv4()
        const filepath = `files/${id}.original.${mime.getExtension(mimetype)}`

        await this.fileService.uploadFile(currentPath, filepath)

        const file = {
            id: id,
            userId: request.session.user.id,
            type: mimetype,
            location: this.config.s3.bucket_url,
            filepath: filepath
        }

        await this.fileDAO.insertFile(file)

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ id ])
        if ( files.length <= 0) {
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(500, 'insertion-failure', `Failed to select newly inserted file ${id}.`)
        }

        this.fileService.removeLocalFile(currentPath)

        const job = await this.core.queue.add('reformat-video', { session: { user: currentUser }, file: file })

        const jobs = {}
        jobs[jobs.id] = job

        response.status(200).json({
            entity: files[0],
            relations: {
                jobs: jobs 
            }
        })

    }


    /**
     * GET /file/:id/src
     *
     * Get the raw file source for display.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the file we wish to get.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getFileSource(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to view a file.`,
                `You must be authenticated to view a file.`)
        }

        const id = request.params.id
        const width = request.query?.width

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ id ])
        if ( files.length <= 0) {
            throw new ControllerError(404, 'not-found', `Failed to find file ${id}.`)
        }
        const file = files[0]

        let path = file.filepath
        if (  width ) {
            path = `files/${id}.${width}.${mime.getExtension(file.type)}`
            const hasFile = await this.fileService.hasFile(path)
            if ( ! hasFile ) {
                request.logger.warn(`Missing width "${width}" for File(${id}).`)
                path = file.filepath
            }
        }

        const url = await this.fileService.getSignedUrl(path)

        response.redirect(302, url)
    }

    /**
     * GET /file/:id
     *
     * Get a file.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the file we wish to get.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getFile(request, response) {

        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to view a file.`,
                `You must be authenticated to view a file.`)
        }

        const id = request.params.id

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ id ])
        if ( files.length <= 0) {
            throw new ControllerError(404, 'not-found', `Failed to find file ${id}.`)
        }
        return response.status(200).json({
            entity: files[0],
            relations: {}
        })
    }

    async patchFile(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be owner of File(:id)
         *
         * Validation:
         *
         * 1. File(:id) must exist.
         * 
         * ********************************************************************/

        const currentUser = request.session.user
        const fileId = request.params.id
        const filePatch = request.body

        // Permissions: 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(403, 'not-authorized', 
                `Must have a logged in user to patch a file.`,
                `You must be authenticated to patch a file.`)
        }

        if ( fileId === null || fileId === undefined || fileId === '' ) {
            throw new ControllerError(400, 'invalid',
                `Missing File.id.`,
                `You must include the file.id in the resource route.`)
        }

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ fileId ])

        // Validation: 1. File(:id) must exist.
        if ( files.length <= 0 ) {
            throw new ControllerError(404, 'not-found', 
                `File(${fileId}) not found!`,
                `File(${fileId}) was not found.`)
        } 

        const file = files[0]

        // TODO TECHDEBT We need a better way to do this.  Right now, Groups
        // are the only objects where people who aren't the file's uploader can
        // manipulate it.  But that's going to change.  Eventually events and
        // organizations will also have this feature.
        //
        // When we implement events we need to note what type of file it is and
        // possibly back link it to the entity using it.
        const groupFileResults = await this.core.database.query(`
            SELECT file_id FROM groups WHERE file_id = $1
        `, [ file.id ])

        // Permissions: 2. User must be owner of File(:id), unless file is group profile.
        if ( file.userId !== currentUser.id && groupFileResults.rows.length <= 0 ) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${currentUser.id}) attempting to PATCH File(${file.id}, which they don't own.`,
                `You cannot PATCH someone else's file.`)
        }

        if ( ! ( 'crop' in filePatch) || filePatch.crop === undefined || filePatch.crop === null ) {
            throw new ControllerError(400, 'invalid',
                `Attempt to patch File(${fileId}) missing crop.`,
                `Must include 'crop' object in order to PATCH a file.`)
        }

        if ( ! ('dimensions' in filePatch) || filePatch.dimensions === undefined || filePatch.dimensions === null) {
            throw new ControllerError(400, 'invalid',
                `Attempt to patch File(${fileId}) missing original dimensions.`,
                `Must include the original dimensions of the object in order to PATCH a file.`)
        }

        const crop = filePatch.crop
        if ( ! ('x' in crop) || ! ('y' in crop) || ! ('width' in crop) || ! ('height' in crop) ) {
            throw new ControllerError(400, 'invalid',
                `Missing element of 'crop' when PATCHing File(${fileId}).`,
                `Missing element of crop data. Need { x, y, width, height}.`)
        }

        const dimensions = filePatch.dimensions
        if ( ! ('width' in dimensions) || ! ('height' in dimensions) ) {
            throw new ControllerError(400, 'invalid',
                `Missing element of 'dimensions' when PATCHing FILE(${fileId}).`,
                `Missing  element of dimension data. Need { width, height }.`)
        }

        await this.imageService.crop(file, crop, dimensions)

        await this.core.queue.add('resize-image', { session: { user: currentUser }, file: file })

        response.status(200).json({
            entity: file,
            relations: {}
        })
    }


    /**
     * DELETE /file/:id
     *
     * Delete a file, remove it from the database and from file storage.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the file we wish to delete.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteFile(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be owner of File(:id)
         *
         * Validation:
         *
         * 1. File(:id) must exist.
         * 
         * ********************************************************************/

        // Permissions: 1. User must be logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to delete a file.`)
        }

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ request.params.id ])

        // Validation: 1. File(:id) must exist.
        if ( files.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `File ${request.params.id} not found!`)
        } 

        // Permissions: 2. User must be owner of File(:id)
        if ( files[0].userId !== request.session.user.id ) {
            // TODO Admin and moderator permissions.
            throw new ControllerError(403, 'not-authorized', `User(${request.session.user.id}) attempting to delete file(${files[0].id}, which they don't own.`)
        }

        // NOTE: We don't need to worry about files in use as profile images,
        // because the database constraint will simply set the users.file_id
        // field to null when the file is deleted.

        /**********************************************************************
         * Permissions and Validation checks complete.
         *      Delete the file.
         **********************************************************************/

        await this.fileService.removeFile(files[0].filepath)

        // Database constraints should handle any cascading here.
        const fileId = request.params.id
        await this.fileDAO.deleteFile(fileId)
        return response.status(200).json({ 
            entity: { 
                id: fileId 
            },
            relations: {}
        })
    }
}
