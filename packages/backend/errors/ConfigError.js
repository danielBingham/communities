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

/**
 * Thrown when the configuration can't be loaded (no definition file for the
 * environment, or values that couldn't be found) or isn't valid, and when
 * the app can't choose AWS credentials (lib/aws-credentials.js).
 *
 * Kept apart from config.js so that the drivers config.js loads can throw it
 * too.
 */
module.exports = class ConfigError extends Error {
    constructor(message, missing) {
        super(message)
        this.name = 'ConfigError'

        /**
         * The values that couldn't be found, as `{ key, source }`: the
         * configuration key (e.g. `database.host`) and where it should have
         * come from (e.g. `env:COMMUNITIES_DATABASE_HOST`).
         */
        this.missing = missing ?? []
    }
}
