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

const { WebSocketService } = require('@communities/backend')

/**
 * We only want one of these to exist at a time. We don't need more than one
 * socket server running, it just wastes resources and will result in duplicate
 * messaging.
 */
let webSocketService = null

const createWebSocketServer = function(core) {
  core.logger.info(`Initializing the Web Socket Server...`)
  webSocketService = new WebSocketService(core)
  webSocketService.initialize()
  return webSocketService.getServer()
}

module.exports = {
    createWebSocketServer: createWebSocketServer
}
