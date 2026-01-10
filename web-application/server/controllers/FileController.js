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

const { FileService, ImageService, VideoService, LocalFileService, S3FileService, ValidationService, FileDAO } = require('@communities/backend')

const { schema } = require('@communities/shared')

const ControllerError = require('../errors/ControllerError')

module.exports = class FileController {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.fileDAO = new FileDAO(core)

        this.fileService = new FileService(core)

        this.s3 = new S3FileService(core)
        this.local = new LocalFileService(core)

        this.videoService = new VideoService(core)
        this.imageService = new ImageService(core)

        this.validationService = new ValidationService(core)

        this.schema = new schema.FileSchema()
    }

    async getRelations(currentUser, results, requestedRelations) {
        return {}
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
        const id = this.schema.properties.id.clean(request.params.id)

        logger.info(`Processing image upload: ${currentPath}`)

        const currentUser = request.session.user 
        if ( ! currentUser ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to upload a file.`)
        }

        const mimetype = request.file.mimetype 
        if ( ! ImageService.SUPPORTED_MIMETYPES.includes(mimetype) ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid file of type ${mimetype}.`,
                `Unsupported file type.  Supported types are: ${ImageService.SUPPORTED_TYPES.join(',')}`)
        }

        const fileExtension = path.extname(request.file.originalname).toLowerCase()
        if ( ! ImageService.SUPPORTED_EXTENSIONS.includes(fileExtension) ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid file of type ${mimetype}.`,
                `Unsupported file extension.  Supported extensions are: ${ImageService.SUPPORTED_EXTENSIONS.join(',')}`)
        }

        const existing = await this.fileDAO.getFileById(id)
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `Attempt to upload to a File(${id}) that doesn't exist.`,
                `You attempted to upload to a File(${id}) that didn't exist.  Please create a pending file with 'POST /files' before attempting an upload.`)
        }

        if ( existing.userId !== currentUser.id ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to upload File(${existing.id}) belonging to User(${existing.userId}).`,
                `You may not upload to another user's file.`)
        }

        const filepath = this.fileService.getPath(existing) 

        await this.s3.uploadFile(currentPath, filepath)

        const file = {
            ...existing,
            type: mimetype,
            location: this.config.s3.bucket_url,
            filepath: filepath
        }

        // Add the new fields that come with video uploads.
        if ( this.core.features.has('issue-67-video-uploads') ) {
            file.state  = 'processing'
            file.kind = mimetype.split('/')[0]
            file.mimetype = mimetype
            file.variants = [ ]
        }

        await this.fileDAO.updateFile(file)

        const job = await this.core.queue.add('resize-image', { session: { user: currentUser }, fileId: file.id })

        if ( this.core.features.has('issue-67-video-uploads') ) {
            const filePatch = {
                id: file.id,
                jobId: job.id
            }
            await this.fileDAO.updateFile(filePatch)
        }

        const entityResults = await this.fileDAO.selectFiles({ 
            where: 'files.id = $1', 
            params: [ id ]
        })

        const entity = entityResults.dictionary[id]
        if ( ! entity ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(500, 'not-found', `Failed to select updated file ${id}.`)
        }

        this.local.removeFile(currentPath)

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(200).json({
            entity: entity,
            relations: relations 
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
        if ( ! this.core.features.has('issue-67-video-uploads') ) {
            throw new ControllerError(503, 'unsupported',
                `Video Uploads are not currently supported.`,
                `Video Uploads are not currently supported.`)
        }

        const currentUser = request.session.user 
        if ( ! currentUser ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to upload a file.`)
        }

        const logger = request.logger ? request.logger : this.core.logger

        const currentPath = request.file.path
        const id = this.schema.properties.id.clean(request.params.id)

        logger.info(`Processing video upload: ${currentPath}`)


        const mimetype = request.file.mimetype 
        if ( ! VideoService.SUPPORTED_MIMETYPES.includes(mimetype) ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid video file of type ${mimetype}.`,
                `Unsupported video type.  Supported types are: ${VideoService.SUPPORTED_TYPES.join(',')}`)
        }

        const fileExtension = path.extname(request.file.originalname).toLowerCase()
        if ( ! VideoService.SUPPORTED_EXTENSIONS.includes(fileExtension) ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid video file of type ${mimetype}.`,
                `Unsupported video extension.  Supported extensions are: ${VideoService.SUPPORTED_EXTENSIONS.join(',')}`)
        }

        const existing = await this.fileDAO.getFileById(id)
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `Attempt to upload to a File(${id}) that doesn't exist.`,
                `You attempted to upload to a File(${id}) that didn't exist.  Please create a pending file with 'POST /files' before attempting an upload.`)
        }

        if ( existing.userId !== currentUser.id ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to upload File(${existing.id}) belonging to User(${existing.userId}).`,
                `You may not upload to another user's file.`)
        }

        const filepath = this.fileService.getPath(existing) 

        await this.s3.uploadFile(currentPath, filepath)

        await this.fileDAO.updateFile({
            id: id,
            state: 'processing',
            kind: mimetype.split('/')[0],
            mimetype: mimetype,
            type: mimetype,
            filepath: filepath
        })

        const job = await this.core.queue.add('process-video', { session: { user: currentUser }, fileId: id})

        await this.fileDAO.updateFile({
            id: id,
            jobId: job.id
        })

        const entityResults = await this.fileDAO.selectFiles({ 
            where: 'files.id = $1', 
            params: [ id ]
        })

        console.log(`EntityResults: `, entityResults)
        const entity = entityResults.dictionary[id]
        if ( ! entity ) {
            this.local.removeFile(currentPath)
            throw new ControllerError(500, 'not-found', `Failed to select newly inserted file ${id}.`)
        }

        this.local.removeFile(currentPath)

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(200).json({
            entity: entity,
            relations: relations 
        })
    }



    /**
     * POST /files
     *
     * Create an initial file to prepare for upload.  Used to create a file in
     * the pending state before begining the uploading and processing process.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postFiles(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to view a file.`,
                `You must be authenticated to view a file.`)
        }

        const file = this.schema.clean(request.body)
        if ( file === undefined || file === null ) {
            throw new ControllerError(400, 'invalid',
                `File must be provided.`,
                `File must be provided.`)
        }


        // Users may only upload their own files.  They may not upload the file
        // of another user.
        if ( file.userId !== currentUser.id ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to create a File belonging to User(${file.userId}).`,
                `You may not create a file for another user.`)
        }

        const validationErrors = this.validationService.validateFile(currentUser, file)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid file: ${logString}`,
                errorString)

        }

        file.variants = []

        await this.fileDAO.insertFile(file)

        const entityResults = await this.fileDAO.selectFiles({ where: 'files.id = $1', params: [ file.id ] })

        const entity = entityResults.dictionary[file.id]
        if ( entity === undefined || entity === null || entityResults.list.length <= 0 ) {
            throw new ControllerError(500, 'insertion-failure', `Failed to select newly inserted file ${file.id}.`)
        }

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(200).json({
            entity: entity,
            relations: relations
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

        const id = this.schema.properties.id.clean(request.params.id)
        let variant = request.query?.variant  // We don't need to clean this
        // because we're going to check it against a cleaned array.

        const results = await this.fileDAO.selectFiles({
            where: 'files.id = $1', 
            params: [ id ]
        })

        const file = results.dictionary[id]
        if ( file === undefined || file === null ) {
            throw new ControllerError(404, 'not-found', 
                `Failed to find File(${id}).`,
                `Failed to find File(${id}).`)
        } 

        if ( this.core.features.has('issue-67-video-uploads') ) {
            if ( variant !== undefined && variant !== null && variant !== 'full' && ! file.variants.includes(variant) ) {
                throw new ControllerError(404, 'not-found', 
                    `Failed to find variant, '${variant}', of File(${id}).`,
                    `Failed to find variant, '${variant}', of File(${id}).`)
            }
        }

        const path = this.fileService.getPath(file, variant)
        const hasFile = await this.s3.hasFile(path)
        if ( ! hasFile ) {
            throw new ControllerError(404, 'not-found', 
                `Failed to find File(${id}) at path '${path}'.`,
                `Failed to find File(${id}) at path '${path}'.`)
        }

        const url = await this.s3.getSignedUrl(path)

        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: file,
            sources: {
                [variant]: url
            },
            relations: relations 
        })
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

        const id = this.schema.properties.id.clean(request.params.id)

        const results = await this.fileDAO.selectFiles({
            where: 'files.id = $1', 
            params: [ id ]
        })

        const file = results.dictionary[id]
        if ( file === undefined || file === null ) {
            throw new ControllerError(404, 'not-found', 
                `Failed to find File(${id}).`,
                `File(${id}) not found.`)
        }

        const sources = {}
        sources['full'] = await this.s3.getSignedUrl(file.filepath)

        if ( this.core.features.has('issue-67-video-uploads') ) {
            const variant = request.query?.variant

            if ( variant !== undefined && variant !== null && variant !== 'full' && file.variants.includes(variant) ) {
                 sources[variant] = await this.s3.getSignedUrl(this.fileService.getPath(file, variant))
            }
        }

        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: file,
            sources: sources,
            relations: relations 
        })
    }

    async patchFile(request, response) {
        const currentUser = request.session.user
        const fileId = this.schema.properties.id.clean(request.params.id)
        const filePatch = request.body

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

        const file = await this.fileDAO.getFileById(fileId) 

        // Validation: 1. File(:id) must exist.
        if ( file === null || file === undefined ) {
            throw new ControllerError(404, 'not-found', 
                `File(${fileId}) not found!`,
                `File(${fileId}) was not found.`)
        } 

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

        // User must be owner of File(:id), unless file is group profile.
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

        const job = await this.core.queue.add('resize-image', { session: { user: currentUser }, fileId: file.id })

        /*if ( this.core.features.has('issue-67-video-uploads') ) {
            const patch = {
                id: fileId,
                state: 'processing',
                jobId: job.id
            }
            await this.fileDAO.updateFile(patch)
        }*/

        const entityResults = await this.fileDAO.selectFiles({
            where: `files.id = $1`, 
            params: [ file.id ]
        })

        const entity = entityResults.dictionary[file.id]
        if ( entity === undefined || entity === null ) {
            throw new ControllerError(500, 'not-found',
                `File(${file.id}) not found after update.`,
                `Something went wrong on the backend.`)
        }

        const url = await this.s3.getSignedUrl(file.filepath)

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(200).json({
            entity: entity,
            sources: {
                ['full']: url
            },
            relations: relations 
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
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to delete a file.`)
        }

        const id = this.schema.properties.id.clean(request.params.id)

        const existing = await this.fileDAO.getFileById(id)
        if ( existing === null || existing === undefined ) {
            throw new ControllerError(404, 'not-found', `File ${request.params.id} not found!`)
        } 

        if ( existing.userId !== currentUser.id ) {
            // TODO Admin and moderator permissions.
            throw new ControllerError(403, 'not-authorized', 
                `User(${request.session.user.id}) attempting to delete file(${files[0].id}, which they don't own.`
                `You are not allowed to delete a file you don't own.`)
        }

        // NOTE: We don't need to worry about files in use as profile images,
        // because the database constraint will simply set the users.file_id
        // field to null when the file is deleted.

        await this.fileService.deleteVariants(existing)
        await this.s3.removeFile(existing.filepath)

        // Database constraints should handle any cascading here.
        await this.fileDAO.deleteFile(id)
        return response.status(200).json({ 
            entity: { 
                id: id 
            },
            relations: {}
        })
    }
}
