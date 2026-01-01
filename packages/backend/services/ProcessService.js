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

const { spawn } = require('node:child_process')


/**
 * A service to handle spawning child CLI processes.
 */
module.exports = class ProcessService {

    constructor(core) {
        this.core = core
    }

    async run(command, commandArgs) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, commandArgs)        

            // Collect standard error output
            let stderr = ''
            process.stderr.on('data', (data) => {
                stderr += data.toString()
            })

            let stdout = ''
            process.stdout.on('data', (data) => {
                this.core.logger.verbose(`Spawned process (${command}) returned output: `, data.toString())
                stdout += data.toString()
            })

            process.on('error', (error) => {
                this.core.logger.warn(`Spawned process (${command}) encountered an error: `, error)
                reject(error)
            })

            process.on('close', (code) => {
                if ( code === 0 ) {
                    resolve()
                } else {
                    this.core.logger.warn(`Spawned process(${command}) finished with error: `, stderr)
                    reject(stderr)
                }
            })
        })
    }

    runRaw(command, commandArgs) {
        return spawn(command, commandArgs)        
    }
}
