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
const fs = require('fs')

module.exports = class LocalFileService {

    constructor(core) {
        this.base = '/public'
    }

    withBase(path) {
        // public/...
        if ( path.substring(0, this.base.length-1) == this.base.substring(1)) {
            return process.cwd() + '/' + path
        // We need to add /public to the front
        } else if ( path.substring(0, this.base.length) !== this.base) { 
            return process.cwd() + this.base + path
        // /public, we don't need to do anything
        } else {
            return process.cwd() + path
        }
    }

    copyFile(currentPath, newPath) {
        fs.copyFileSync(currentPath, newPath) 
    }

    moveFile(currentPath, newPath) {
        fs.copyFileSync(currentPath, newPath) 
        fs.rmSync(currentPath)
    }

    fileExists(path) {
        return fs.existsSync(path)
    }

    removeFile(path) {
        fs.rmSync(path)
    }

    readFile(path) {
        return fs.readFileSync(path)
    }

    getFileSize(path) {
        const stats = fs.statSync(path)
        return stats?.size
    }
}
