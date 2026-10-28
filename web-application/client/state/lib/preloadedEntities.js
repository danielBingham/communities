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
 * Preloaded Entities
 *
 * The server sends some pages with the entities it read to render them -- a
 * News post comes with the post -- shaped like an API response's relations:
 *
 *  <script type="application/json" id="communities-preloaded-entities">
 *      {"news":{"09-29-2026-a-post":{"title":"A Post",...}}}
 *  </script>
 *
 * index.js loads them into the store before the app renders, with
 * setRelationsInState(), so the hooks find them there and don't request them.
 * See `server/controllers/PageController.js` for the other side.
 *
 * The mobile apps load index.html from their bundle, so they never have any.
 ******************************************************************************/
import * as shared from '@communities/shared'

import logger from '/logger'

const isObject = (value) => value !== null && typeof value === 'object' && ! Array.isArray(value)

/**
 * Read the entities the server sent with the page.
 *
 * Anything that isn't a dictionary of entities is left out, so a bad
 * <script> can only cost us the preloading.
 *
 * @return {Object|null} The entities, shaped like an API response's
 * relations, or null when the page came without any.
 */
export const getPreloadedEntities = function() {
    if ( typeof document === 'undefined' ) {
        return null
    }

    const element = document.getElementById(shared.lib.preloadedEntities.ELEMENT_ID)
    if ( element === null ) {
        return null
    }

    let parsed = null
    try {
        parsed = JSON.parse(element.textContent)
    } catch (error) {
        logger.warn(`PreloadedEntities:: Couldn't read the entities preloaded with the page: `, error)
        return null
    }

    if ( ! isObject(parsed) ) {
        return null
    }

    const entities = {}
    for(const [type, dictionary] of Object.entries(parsed)) {
        if ( ! isObject(dictionary) ) {
            continue
        }

        const valid = Object.entries(dictionary).filter(([key, entity]) => isObject(entity))
        if ( valid.length > 0 ) {
            entities[type] = Object.fromEntries(valid)
        }
    }

    return Object.keys(entities).length > 0 ? entities : null
}
