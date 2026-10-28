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
 * When the server reads an entity to render a page's metadata -- a News post
 * for its link preview -- it sends the entity with the page, so the client
 * doesn't have to request it again.  The entities go in index.html in the
 * same shape as an API response's `relations`, a dictionary of each entity
 * type's dictionary:
 *
 *  <script type="application/json" id="communities-preloaded-entities">
 *      {"news":{"09-29-2026-a-post":{"title":"A Post",...}}}
 *  </script>
 *
 * and the client loads them into its store when it starts, with the same
 * code that loads relations (setRelationsInState()).
 *
 * See `web-application/server/controllers/PageController.js` and
 * `web-application/client/state/lib/preloadedEntities.js`.
 ******************************************************************************/

/**
 * The id of the <script> element that holds the entities.
 */
const ELEMENT_ID = 'communities-preloaded-entities'

module.exports = {
    ELEMENT_ID: ELEMENT_ID
}
