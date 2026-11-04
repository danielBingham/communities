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

const { fetchEndpoint } = require('./fetchEndpoint')

// Fetch the /system/initialization payload.  Among other things this includes
// the server's feature-flag configuration under `features`, which lets tests
// detect whether an optional, flag-gated feature is available on the target
// environment before exercising it.
const getInitialization = async function() {
    const response = await fetchEndpoint('GET', '/system/initialization')
    if ( ! response.ok ) {
        throw new Error('Initialization failed.')
    }
    return response.content
}

// Return true when the named feature flag is enabled on the target server.
//
// This mirrors the backend's FeatureFlags.has(): a feature counts as "on" only
// when it is present and its status is exactly 'enabled'.  Anything else
// (missing, 'disabled', mid-migration, etc.) is treated as off.
const isFeatureEnabled = async function(name) {
    const initialization = await getInitialization()
    const features = initialization.features ?? {}
    const feature = features[name]
    return feature !== undefined && feature !== null && feature.status === 'enabled'
}

module.exports = {
    getInitialization: getInitialization,
    isFeatureEnabled: isFeatureEnabled
}
