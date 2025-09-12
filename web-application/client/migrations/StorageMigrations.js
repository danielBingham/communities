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
import logger from '/logger'

const currentVersion = 1

const migrateVersion0to1= function() {
    logger.debug(`Migrating localStorage from version 0 to version 1...`)
    // We're not going to both trying to migrate from version zero.  Just wipe
    // it out and give us a clean slate.  The only thing in there should be
    // drafts.
    localStorage.clear()
}

// Order matters!
const migrations = [
    migrateVersion0to1
]

export default function migrateLocalStorage() {
    const storageVersion = parseInt(localStorage.getItem('version'))
    if ( storageVersion === NaN ) {
        storageVersion = 0
    }

    logger.debug(`Current localStorage version: `, storageVersion)

    // Start with the storage version and run each migration up to the current
    // version in order.  This is why order matters in the migrations array.
    if ( storageVersion !== currentVersion) {
        for(let index = storageVersion; index < migrations.length; index++) {
            const migration = migrations[index]
            migration()
        }
        logger.debug(`Migrated localStorage to version: `, currentVersion)
        localStorage.setItem('version', currentVersion)
    } else {
        logger.debug(`localStorage up to date with version: `, currentVersion)
    }
}
