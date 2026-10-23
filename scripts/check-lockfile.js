#!/usr/bin/env node
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
 * Lockfile guard.
 *
 * Lockfile integrity is our supply-chain control: every third-party package is
 * pinned to an exact tarball by its sha512 hash, and `npm ci` refuses anything
 * that doesn't match. This check keeps that control intact. It fails when
 * package-lock.json:
 *
 *   1. resolves a package from any host other than the public npm registry,
 *   2. has a registry package without a sha512 integrity hash, or
 *   3. resolves an internal `@communities/*` package from anywhere other than
 *      a workspace link.
 *
 * Rule 3 matters because the `@communities` scope on the public registry is
 * not ours. An internal package resolved from a registry would install code
 * published by whoever controls that scope.
 *
 * Usage: node scripts/check-lockfile.js [path/to/package-lock.json]
 ******************************************************************************/

const fs = require('node:fs')
const path = require('node:path')

const REGISTRY = 'https://registry.npmjs.org/'
const INTERNAL_SCOPE = '@communities/'

const lockfilePath = path.resolve(process.argv[2] ?? path.join(__dirname, '..', 'package-lock.json'))
const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'))
const rootManifest = JSON.parse(fs.readFileSync(path.join(path.dirname(lockfilePath), 'package.json'), 'utf8'))
const workspaces = new Set(rootManifest.workspaces ?? [])

const problems = []

if ( lockfile.lockfileVersion !== 3 ) {
    problems.push(`Expected lockfileVersion 3, found ${lockfile.lockfileVersion}.`)
}

for (const [location, entry] of Object.entries(lockfile.packages ?? {})) {
    // The root project and the workspace folders themselves.
    if ( ! location.includes('node_modules/') ) {
        continue
    }

    const name = entry.name ?? location.slice(location.lastIndexOf('node_modules/') + 'node_modules/'.length)

    if ( name.startsWith(INTERNAL_SCOPE) ) {
        if ( entry.link !== true || ! workspaces.has(entry.resolved) ) {
            problems.push(`${location}: internal package must be a link to a workspace, found ${JSON.stringify(entry.resolved)}.`)
        }
        continue
    }

    if ( entry.link === true ) {
        problems.push(`${location}: unexpected link to ${JSON.stringify(entry.resolved)}.`)
        continue
    }

    // Bundled dependencies ship inside their parent's tarball, which is
    // itself covered by the parent's integrity hash.
    if ( entry.inBundle === true ) {
        continue
    }

    if ( typeof entry.resolved !== 'string' || ! entry.resolved.startsWith(REGISTRY) ) {
        problems.push(`${location}: resolved from ${JSON.stringify(entry.resolved)}, expected ${REGISTRY}.`)
    }

    if ( typeof entry.integrity !== 'string' || ! entry.integrity.startsWith('sha512-') ) {
        problems.push(`${location}: missing sha512 integrity (found ${JSON.stringify(entry.integrity)}).`)
    }
}

if ( problems.length > 0 ) {
    console.error(`Lockfile check failed for ${lockfilePath}:\n`)
    for (const problem of problems) {
        console.error(`  - ${problem}`)
    }
    console.error(`\n${problems.length} problem(s).`)
    console.error(`If a mirror or a registry setting in your user-level .npmrc wrote these URLs, revert`)
    console.error(`package-lock.json and redo the install against the public registry, for example:`)
    console.error(`  git checkout package-lock.json && npm install <package> --registry=${REGISTRY}`)
    process.exit(1)
}

console.log(`Lockfile check passed: ${Object.keys(lockfile.packages).length} entries, all from ${REGISTRY} or workspace links.`)
