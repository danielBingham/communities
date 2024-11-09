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
const path = require('path')
const fs = require('fs')

const Handlebars = require('handlebars')

/**
 * A service to handle logic related to Server Side Rendering.  For now, it's
 * just handling rendering the metadata into the page <head> tag.  That include
 * social sharing metadata as well as standard SEO metadata.
 */
module.exports = class ServerSideRenderingService {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.indexTemplatePath = null
        if ( this.config.environment == 'development' ) {
            this.indexTemplatePath = 'server/views/index.html'
        } else {
            this.indexTemplatePath = 'public/dist/index.html'
        }
    }

    /**
     * Render the index.html template appropriate to the environment using the
     * given metadata object.
     *
     * @param {Object} metadata The metadata to use to render the template.
     *
     * @return {string} The parsed template string.
     */
    renderIndexTemplate(metadata) {
        const filepath = path.join(process.cwd(), this.indexTemplatePath)
        const rawTemplate = fs.readFileSync(filepath, 'utf8')
        const template = Handlebars.compile(rawTemplate)
        const parsedTemplate = template(metadata)
        return parsedTemplate
    }
}
