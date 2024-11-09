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
 * A light wrapper around our feature flag information that can live on `Core`
 * and be populated by `FeatureService` for each request.
 ******************************************************************************/
module.exports = class FeatureFlags {


    constructor(features) {
        /**
         * This will be populated by `FeatureService`.
         */
        if ( features ) { 
            this.features = features 
        } else {
            this.features = {}
        }
    }

    hasFeature(name) {
        const feature = this.features[name]

        return feature && feature.status == 'enabled'
    }

}
