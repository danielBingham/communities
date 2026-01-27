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
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm")

module.exports = class Config {
    constructor(environment, region, credentials) {
        this.environment = environment

        this.client = new SSMClient({
            region: region,
            credentials: credentials
        })
    }

    async loadConfig(configDefinition) {
        const config = {}

        for(const [key, value] of Object.entries(configDefinition)) {
            if ( typeof value === 'string' ) {
                if ( value.startsWith('aws-ssm-parameter:') ) {
                    config[key] = await this.loadParameter(value.substring(value.indexOf(':')+1))
                } else {
                    config[key] = value
                }
            } else if ( typeof value === 'object' && ! Array.isArray(value) && value !== null ) {
                config[key] = await this.loadConfig(value) 
            }
        }

        return config
    }

    async loadParameter(param) {
        const fullyQualifiedParameterPath = path.join(`/${this.environment}`, param)
        const command = new GetParameterCommand({
            Name: fullyQualifiedParameterPath,
            WithDecryption: true
        })
        try { 
            const response = await this.client.send(command)
            return response.Parameter.Value
        } catch (error) {
            console.error(`Got error while loading parameter: '${fullyQualifiedParameterPath}'::`, error)
            throw error
        }

        return undefined
    }
}
