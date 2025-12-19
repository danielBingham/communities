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

const { Core, Config } = require('@communities/backend')

/**********************************************************************
 * Load Configuration
 **********************************************************************/
const configDefinition = require('./config') 


const createCore = async function(name) {

    const environmentName = process.env.ENVIRONMENT_NAME
    const region = process.env.AWS_REGION
    const credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }

    const configLoader = new Config(environmentName, region, credentials)
    const config = await configLoader.loadConfig(configDefinition)

    console.log('Configuration successfully loaded...')

    const core = new Core(name, config)
    await core.initialize()

    return core
}

module.exports = {
    createCore: createCore 
}
