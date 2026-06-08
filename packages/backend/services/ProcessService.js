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

const ServiceError = require('../errors/ServiceError')
const ProcessError = require('../errors/ProcessError')

class Process {

    constructor(core, command, args) {
        this.core = core

        this.command = command ?? null 
        this.args = args ?? [] 

        this.stdout = ''
        this.stderr = ''

        this.pipes = {
            stdout: [],
            stderr: []
        }
    }

    async run() {
        return new Promise((resolve, reject) => {
            if ( this.command === null ) {
                return reject(new ProcessError('empty', 'Empty process.', ''))
            }

            const process = spawn(this.command, this.args)        

            // Collect standard error output
            process.stderr.on('data', (data) => {
                const stringData = data.toString()
                this.stderr += stringData

                this.trigger('stderr', stringData)
            })

            process.stdout.on('data', (data) => {
                const stringData = data.toString()
                this.stdout += stringData

                this.trigger('stdout', stringData)
            })

            process.on('error', (error) => {
                this.core.logger.warn(`Spawned process (${this.command} ${this.args.join(' ')}) encountered an error: `, error)
                reject(error)
            })

            process.on('close', (code) => {
                if ( code === 0 ) {
                    resolve()
                } else {
                    this.core.logger.warn(`Spawned process(${this.command} ${this.args.join(' ')}) finished with error: `, this.stderr)
                    reject(new ProcessError('error-code', `Spawned process(${this.command}) failed with error.`, this.stderr))
                }
            })
        })
    }

    on(pipe, handler) {
        if ( ! ( pipe in this.pipes) ) {
            throw new ServiceError('no-pipe', `No pipe named '${pipe}' to subscribe.`)
        }

        this.pipes[pipe].push(handler)
    }

    trigger(pipe, output) {
        if ( ! (pipe in this.pipes) ) {
            throw new ServiceError('no-pipe', `No pipe named '${pipe}' to trigger.`)
        }

        for(const handler of this.pipes[pipe] ) {
            handler(output)
        }
    }

    getStdout() {
        return this.stdout
    }

    getStderr() {
        return this.stderr
    }
}


/**
 * A service to handle spawning child CLI processes.
 */
module.exports = class ProcessService {

    constructor(core) {
        this.core = core
    }

    spawn(command, args) {
        return new Process(this.core, command, args)
    }

    async run(command, args) {
        const process = this.spawn(command, args)
        await process.run()
        return process.getStdout()
    }

    runRaw(command, commandArgs) {
        return spawn(command, commandArgs)        
    }
}
