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
 *      Page Router
 *
 * Every request that isn't for the API or a static file is for a page of the
 * web application, and gets index.html (see PageController).  The client's
 * router decides what's on the page.
 *
 * Pages with metadata of their own -- a title, description and link preview
 * -- get a route here, with the same path as the client's route in
 * `client/App.js`.  Everything else gets the default metadata.
 *
 * To give another page its own metadata, add a method for it to
 * PageMetadataService (and a builder to `lib.pageMetadata` in
 * @communities/shared), a method that uses it to PageController and a route
 * for it here.  If the page reads an entity to build its metadata, preload
 * the entity too, so the client doesn't request it again.
 *
 * Pages that read from storage or the database are rate limited like the API
 * requests they stand in for.
 ******************************************************************************/
const express = require('express')

const rateLimit = require('./middleware/rateLimit')

const PageController = require('./controllers/PageController')

const createPageRouter = function(core) {
    const router = express.Router()

    const pageController = new PageController(core)

    router.get('/', function(request, response, next) {
        pageController.getRoot(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * News (`/about/news/:url?` in client/App.js)
     **************************************************************************/
    router.get('/about/news', function(request, response, next) {
        pageController.getNewsList(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/about/news/:slug', rateLimit(core, 2400), function(request, response, next) {
        pageController.getNews(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * Everything else.
     **************************************************************************/
    router.all('{*any}', function(request, response, next) {
        pageController.getPage(request, response).catch(function(error) {
            next(error)
        })
    })

    return router
}

module.exports = {
    createPageRouter: createPageRouter
}
