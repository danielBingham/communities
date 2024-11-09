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
const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')


module.exports = class TagController {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.tagDAO = new backend.TagDAO(core)
    }

    /**
     * Get related entities.  Currently a no-op as no related entities have
     * been implemented.
     */
    async getRelations(results, requestedRelations) {
        return {}
    }

    /**
     * Helper method.
     *
     * Build a query object from the query string that can be used with both
     * `TagDAO::selectTags()` and `TagDAO::countTags()`.
     *
     * @param {Object} query    (Optional) Query data used to shape the result set.
     * @param {string} query.name   (Optional) The name, or partial name, of a
     * tag we're searching for.
     * @param {int} query.parent    (Optional) The tagId of a parent tag who's
     * children we'd like to query for.
     * @param {int} query.child     (Optional) The tagId of a child
     * tag who's parents we'd like to select.
     * @param {int} query.depth     (Optional) A depth.  We'll restrict
     * the query to only tags that exist at that depth in the tree.
     * @param {int} query.page      (Optional) The results page to
     * return.
     *
     * @returns {Object}    Returns a results object who's pieces can be passed
     * to either `TagDAO::selectTags()` or `TagDAO::countTags()`.  The
     * result object has the following structure: 
     *
     * ```
     * {
     *  where: '', // SQL, the WHERE portion of the query (including the WHERE keyword).
     *  params: [], // A parameter array matching the `$d` parameters in the `where` statement.
     *  page: 1, // A page defining which page of the results set we want.
     *  order: '', // An order parameter, understandable by select and count.
     *  emptyResult: false // Will be `true` if there's an empty result set,
     *  // allowing us to by pass the call to count or select.
     *  }
     *  ```
     */
    async parseQuery(query, options) {
        options = options || {
            ignorePage: false
        }

        if ( ! query) {
            return
        }

        let count = 0

        const result = {
            where: 'WHERE',
            params: [],
            page: 1,
            order: '',
            requestedRelations: query.relations ? query.relations : [],
            emptyResult: false
        }

        if ( query.name && query.name.length > 0) {
            count += 1
            result.where += ` tags.name % $${count}`
            result.params.push(query.name)
            result.order = `SIMILARITY(tags.name, $${count}) desc`

        }

        if ( query.ids ) {
            count += 1
            result.where += `${ count > 1 ? ' AND ' : ''} tags.id = ANY($${count}::int[])`
            result.params.push(query.ids)
            options.ignorePage = true
        }

        if ( query.page && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        // We didn't end up adding any parameters.
        if ( result.where == 'WHERE') {
            result.where = ''
        }

        return result 
    }

    /**
     * GET /tags
     *
     * Responds with a `results` object with meta containing meta data about
     * the results set (page, count, etc) and results containing an array of
     * results.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.query    (Optional) Query data used to shape the result set.
     * @param {string} request.query.name   (Optional) The name, or partial name, of a
     * tag we're searching for.
     * @param {int} request.query.parent    (Optional) The tagId of a parent tag who's
     * children we'd like to query for.
     * @param {int} request.query.child     (Optional) The tagId of a child
     * tag who's parents we'd like to select.
     * @param {int} request.query.depth     (Optional) A depth.  We'll restrict
     * the query to only tags that exist at that depth in the tree.
     * @param {int} request.query.page      (Optional) The results page to
     * return.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getTags(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const { where, params, order, page, emptyResult, requestedRelations } = await this.parseQuery(request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                dictionary: {},
                list: [],
                relations: {}
            })
        }
        
        const results = await this.tagDAO.selectTags(where, params, order, page)
        results.meta = await this.tagDAO.countTags(where, params, page)

        results.relations = await this.getRelations(results, requestedRelations)

        return response.status(200).json(results)
    }

    /**
     * POST /tags
     *
     * Create a new tag in the this.database from the provided JSON.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postTags(request, response) {
        throw new ControllerError(501, 'not-implemented', `Attempt to create a new tag, but it's not implemented yet.`)
        // TODO Commenting this out until we need it in Issue #95.
        /*if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Attempt to create a new tag from an unauthenticated user.`)
        }

        const tag = request.body

        // If a tag already exists with that name, send a 400 error.
        //
        const tagExistsResults = await this.database.query(
            'SELECT id, name FROM tags WHERE name=$1',
            [ tag.name ]
        )

        if (tagExistsResults.rowCount > 0) {
            throw new ControllerError(400, 'tag-exists', `Attempt to create a new tag(${tag.name}), when a tag of that name already exists.`)
        }

        tag.id = await this.tagDAO.insertTag(tag)
        await this.tagDAO.insertTagRelationships(tag)

        const returnTags = await this.tagDAO.selectTags('WHERE tags.id=$1', [results.rows[0].id])
        if ( returnTags.length <= 0) {
            throw new ControllerError(500, 'server-error', `Tag(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(201).json(returnTags[0])*/
    }

    /**
     * GET /tag/:id
     *
     * Get details for a single tag in the database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of a Tag.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getTag(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const results = await this.tagDAO.selectTags('WHERE tags.id = $1', [request.params.id])

        if ( results.length <= 0 ) {
            throw new ControllerError(404, 'no-resource', `Failed to find Tag(${request.params.id})`)
        }

        const relations = await this.getRelations(results)

        return response.status(200).json({ 
            entity: results.list[0],
            relations: relations
        })
    }

    /**
     * PATCH /tag/:id
     *
     * Update an existing tag given a partial set of tags in JSON.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchTag(request, response) {
        throw new ControllerError(501, 'not-implemented',
            `Attempt to patch a tag, but it's not implemented.`)
        // TODO Commented out until its needed for Issue #95. 
        /*const tag = request.body
        tag.id = request.params.id

        let sql = 'UPDATE tags SET '
        let params = []
        let count = 1
        for(let key in tag) {
            if ( key == 'id' ) {
                continue
            }

            sql += `${key} = $${count} and `

            params.push(tag[key])
            count = count + 1
        }
        sql += `updated_date = now() WHERE id = $${count}`
        params.push(tag.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount == 0 ) {
            throw new ControllerError(404, 'no-resource', `Failed to find Tag(${request.params.id})`)
        }

        const returnTags = await this.tagDAO.selectTags('WHERE tags.id=$1', [tag.id])
        if ( returnTags.length <= 0) {
            throw new ControllerError(500, 'server-error', `Tag(${results.rows[0].id}) doesn't exist after creation!`)
        }
        return response.status(200).json(returnTags[0])*/
    }

    /**
     * DELETE /tag/:id
     *
     * Delete an existing tag.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteTag(request, response) {
        throw new ControllerError(501, 'not-implemented',
            `Attempt to delete a tag, but it's not implemented.`)
        // TODO commented out until its needed for Issue #95.
        /*const results = await this.database.query(
            'delete from tags where id = $1',
            [ request.params.id ]
        )

        if ( results.rowCount == 0) {
            throw new ControllerError(404, 'no-resource', `Failed to find Tag(${request.params.id})`)
        }

        return response.status(200).json({tagId: request.params.id})*/
    }
} 
